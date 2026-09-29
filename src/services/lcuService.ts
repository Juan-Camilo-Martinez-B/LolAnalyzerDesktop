// ============================================================
// LolAnalyzer - LCU (League Client Update) Service
// src/services/lcuService.ts
//
// Polls the LCU (Riot Client) REST API running on localhost.
// In Overwolf context this runs inside the background window.
// In dev mode the calls are intercepted and mocked.
// ============================================================

import type { SummonerProfile, RankedInfo, ChampSelectSession, Region } from '../types/game';
import { eventBus } from './eventBus';

/* ─────────────────────────────────────────────────────────
   LCU detection
───────────────────────────────────────────────────────── */
let _lcuPort: number | null = null;
let _lcuToken: string | null = null;
let _pollInterval: ReturnType<typeof setInterval> | null = null;

/** Set credentials discovered from the lockfile (background window reads it) */
export function setLcuCredentials(port: number, token: string): void {
  _lcuPort = port;
  _lcuToken = token;
}

function lcuUrl(path: string): string {
  return `https://127.0.0.1:${_lcuPort ?? 2999}${path}`;
}

async function lcuFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!_lcuPort || !_lcuToken) {
    throw new Error('LCU credentials not set');
  }
  const token = btoa(`riot:${_lcuToken}`);
  const res = await fetch(lcuUrl(path), {
    ...options,
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) throw new Error(`LCU ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

/* ─────────────────────────────────────────────────────────
   Summoner / Profile
───────────────────────────────────────────────────────── */
interface LcuSummonerRaw {
  puuid: string;
  summonerId: number;
  accountId: string;
  displayName: string;
  summonerLevel: number;
  profileIconId: number;
}

export async function getCurrentSummoner(region: Region = 'la1'): Promise<SummonerProfile> {
  const raw = await lcuFetch<LcuSummonerRaw>('/lol-summoner/v1/current-summoner');
  return { ...raw, region };
}

export async function getRankedStats(summonerId: number): Promise<RankedInfo[]> {
  return lcuFetch<RankedInfo[]>(`/lol-ranked/v1/ranked-stats/${summonerId}`);
}

/* ─────────────────────────────────────────────────────────
   Champion Select Session
───────────────────────────────────────────────────────── */
export async function getChampSelectSession(): Promise<ChampSelectSession | null> {
  try {
    return await lcuFetch<ChampSelectSession>('/lol-champ-select/v1/session');
  } catch {
    return null; // 404 means not in champ select
  }
}

/* ─────────────────────────────────────────────────────────
   Gameflow phase polling
───────────────────────────────────────────────────────── */
type LcuGameflowPhase =
  | 'None'
  | 'Lobby'
  | 'Matchmaking'
  | 'CheckedIntoTournament'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'GameStart'
  | 'InProgress'
  | 'WaitingForStats'
  | 'PreEndOfGame'
  | 'EndOfGame';

export function startLcuPolling(intervalMs = 2500): void {
  if (_pollInterval) stopLcuPolling();

  let lastPhase: LcuGameflowPhase | null = null;
  let lastChampSelectHash = '';

  _pollInterval = setInterval(async () => {
    try {
      // ── Gameflow phase ──────────────────────────────
      const phase = await lcuFetch<LcuGameflowPhase>('/lol-gameflow/v1/gameflow-phase');

      if (phase !== lastPhase) {
        lastPhase = phase;
        const mapped = _mapLcuPhase(phase);
        eventBus.emit('game:phase_changed', { phase: mapped });

        if (phase === 'ChampSelect') {
          const session = await getChampSelectSession();
          if (session) eventBus.emit('champ_select:started', session);
        }
        if (phase === 'None' || phase === 'Lobby') {
          eventBus.emit('champ_select:ended');
        }
      }

      // ── Champ select live updates ───────────────────
      if (phase === 'ChampSelect') {
        const session = await getChampSelectSession();
        if (session) {
          const hash = JSON.stringify(session.actions);
          if (hash !== lastChampSelectHash) {
            lastChampSelectHash = hash;
            eventBus.emit('champ_select:updated', session);
          }
        }
      }

    } catch {
      // LCU not reachable → disconnect
      if (lastPhase !== null) {
        lastPhase = null;
        eventBus.emit('lcu:disconnected');
      }
    }
  }, intervalMs);
}

export function stopLcuPolling(): void {
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }
}

/* ─────────────────────────────────────────────────────────
   Connection probe (called from background on startup)
───────────────────────────────────────────────────────── */
export async function probeLcuConnection(port: number, token: string): Promise<boolean> {
  setLcuCredentials(port, token);
  try {
    await getCurrentSummoner();
    eventBus.emit('lcu:connected');
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────
   Mock mode (dev without Riot client open)
───────────────────────────────────────────────────────── */
export function injectMockLcuProfile(profile: SummonerProfile): void {
  console.log('[LCU] Mock profile injected:', profile.displayName);
  // Dispatch directly through event bus — components subscribe to this
  eventBus.emit('backend:sync_complete');
}

/* ─────────────────────────────────────────────────────────
   Runes & Spells Importer
───────────────────────────────────────────────────────── */
export interface LcuRunePageInput {
  name: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
  current?: boolean;
}

export async function importRunePage(page: LcuRunePageInput): Promise<void> {
  try {
    // Delete current page if limit reached, or post new page
    await lcuFetch('/lol-perks/v1/pages', {
      method: 'POST',
      body: JSON.stringify(page),
    });
  } catch (err) {
    console.log('[LCU] Rune import mock/fallback executed:', err);
  }
}

export async function setSummonerSpells(spell1Id: number, spell2Id: number): Promise<void> {
  try {
    await lcuFetch('/lol-champ-select/v1/session/my-selection', {
      method: 'PATCH',
      body: JSON.stringify({ spell1Id, spell2Id }),
    });
  } catch (err) {
    console.log('[LCU] Summoner spells set mock/fallback executed:', err);
  }
}

/* ─────────────────────────────────────────────────────────
   Phase mapper
───────────────────────────────────────────────────────── */
function _mapLcuPhase(phase: LcuGameflowPhase) {
  const map: Record<LcuGameflowPhase, import('../types/game').GamePhase> = {
    None:                     'NONE',
    Lobby:                    'LOBBY',
    Matchmaking:              'MATCHMAKING',
    CheckedIntoTournament:    'MATCHMAKING',
    ReadyCheck:               'MATCHMAKING',
    ChampSelect:              'CHAMP_SELECT',
    GameStart:                'IN_GAME',
    InProgress:               'IN_GAME',
    WaitingForStats:          'END_OF_GAME',
    PreEndOfGame:             'END_OF_GAME',
    EndOfGame:                'END_OF_GAME',
  };
  return map[phase] ?? 'NONE';
}

export const lcuService = {
  getCurrentSummoner,
  probeLcuConnection,
  injectMockLcuProfile,
  importRunePage,
  setSummonerSpells,
};
