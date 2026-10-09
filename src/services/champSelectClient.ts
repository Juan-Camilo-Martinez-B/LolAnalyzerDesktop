import { ensureDdragonVersion } from './assetResolver';
import type { ChampSelectPlayer, ChampSelectSession } from '../types/game';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

type RawPlayer = {
  cellId?: number;
  championId?: number;
  assignedPosition?: string;
  summonerId?: number;
  puuid?: string;
  spell1Id?: number;
  spell2Id?: number;
  gameName?: string;
  summonerName?: string;
};

type RawAction = {
  type?: string;
  championId?: number;
  completed?: boolean;
  isAllyAction?: boolean;
  isInProgress?: boolean;
  actorCellId?: number;
  id?: number;
};

type RawSession = {
  actions?: RawAction[][];
  localPlayerCellId?: number;
  myTeam?: RawPlayer[];
  theirTeam?: RawPlayer[];
  bans?: { myTeamBans?: number[]; theirTeamBans?: number[] };
  timer?: { phase?: string; adjustedTimeLeftInPhase?: number };
};

const LANES: Record<string, string> = {
  top: 'TOP',
  jungle: 'JUNGLE',
  middle: 'MID',
  mid: 'MID',
  bottom: 'ADC',
  bot: 'ADC',
  utility: 'SUPPORT',
  support: 'SUPPORT',
};

let championNamesRequest: Promise<Map<number, string>> | null = null;

function loadChampionNames(): Promise<Map<number, string>> {
  if (!championNamesRequest) {
    championNamesRequest = ensureDdragonVersion()
      .then(async (version) => {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        if (!response.ok) return new Map<number, string>();
        const body = await response.json() as { data?: Record<string, { key?: string; id?: string }> };
        const names = new Map<number, string>();
        for (const champ of Object.values(body.data ?? {})) {
          const id = Number(champ.key);
          if (Number.isInteger(id) && champ.id) names.set(id, champ.id);
        }
        return names;
      })
      .catch(() => new Map<number, string>());
  }
  return championNamesRequest;
}

function lane(position: string | undefined): string {
  const key = (position ?? '').toLowerCase();
  return LANES[key] ?? (key ? key.toUpperCase() : 'FILL');
}

function mapPlayer(
  raw: RawPlayer,
  names: Map<number, string>,
  localCell: number,
  ally: boolean,
): ChampSelectPlayer {
  const championId = Number(raw.championId ?? 0);
  return {
    cellId: Number(raw.cellId ?? 0),
    championId,
    championName: names.get(championId) ?? '',
    assignedPosition: lane(raw.assignedPosition),
    summonerId: raw.summonerId,
    puuid: raw.puuid,
    spell1Id: raw.spell1Id,
    spell2Id: raw.spell2Id,
    summonerName: raw.gameName || raw.summonerName || (ally ? 'Aliado' : 'Enemigo'),
    isLocalPlayer: Number(raw.cellId) === localCell,
  };
}

function mapSession(raw: RawSession, names: Map<number, string>): ChampSelectSession {
  const localCell = Number(raw.localPlayerCellId ?? -1);
  const myTeamBans = [...(raw.bans?.myTeamBans ?? [])];
  const theirTeamBans = [...(raw.bans?.theirTeamBans ?? [])];
  for (const group of raw.actions ?? []) {
    for (const action of group ?? []) {
      const championId = Number(action.championId ?? 0);
      if (action.type !== 'ban' || championId <= 0) continue;
      const bucket = action.isAllyAction ? myTeamBans : theirTeamBans;
      if (!bucket.includes(championId)) bucket.push(championId);
    }
  }

  return {
    actions: (raw.actions ?? []).map((group) => (group ?? []).map((action) => ({
      actorCellId: Number(action.actorCellId ?? 0),
      championId: Number(action.championId ?? 0),
      completed: Boolean(action.completed),
      id: Number(action.id ?? 0),
      isAllyAction: Boolean(action.isAllyAction),
      isInProgress: Boolean(action.isInProgress),
      type: action.type === 'ban' ? 'ban' : 'pick',
    }))),
    localPlayerCellId: localCell,
    myTeam: (raw.myTeam ?? []).map((player) => mapPlayer(player, names, localCell, true)),
    theirTeam: (raw.theirTeam ?? []).map((player) => mapPlayer(player, names, localCell, false)),
    bans: { myTeamBans, theirTeamBans },
    timer: {
      phase: raw.timer?.phase ?? '',
      adjustedTimeLeftInPhase: Number(raw.timer?.adjustedTimeLeftInPhase ?? 0),
    },
  };
}

export async function fetchLiveChampSelect(): Promise<ChampSelectSession | null> {
  const response = await fetch(`${BASE_URL}/api/champ-select/session`);
  if (!response.ok) return null;
  const body = await response.json() as { is_active?: boolean; session?: RawSession | null };
  if (!body.is_active || !body.session) return null;
  return mapSession(body.session, await loadChampionNames());
}
