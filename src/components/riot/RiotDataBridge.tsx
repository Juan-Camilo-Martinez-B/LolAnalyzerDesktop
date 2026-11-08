import { useEffect } from 'react';
import { eventBus } from '../../services/eventBus';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchClientProfile,
  fetchLinkedProfile,
  syncClientHistory,
  type RiotProfilePayload,
  type RiotStatsPayload,
} from '../../services/backendAuth';
import {
  ALL_PROFILES,
  chooseActiveProfile,
  fetchProfileHistory,
  fetchProfiles,
  type StoredRiotProfile,
} from '../../services/riotProfiles';
import { publishAppError } from '../../services/userErrors';
import type { ChampionPerformance, KpiSummary } from '../../types/stats';
import type { MatchRecord, RankedInfo, Region, SummonerProfile, Tier } from '../../types/game';

// A client that was already open answers right after the first load; skip that repeat.
const RELOAD_GAP_MS = 8000;

const TIERS = new Set(['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']);

type ProfileSnapshot = Pick<RiotProfilePayload, 'puuid' | 'gameName' | 'tagLine' | 'summonerLevel' | 'profileIconId' | 'rankedSolo'>;

function toSummoner(profile: ProfileSnapshot, region: Region): SummonerProfile {
  return {
    puuid: profile.puuid,
    summonerId: 0,
    accountId: profile.puuid,
    displayName: `${profile.gameName ?? 'Invocador'}#${profile.tagLine ?? ''}`,
    gameName: profile.gameName ?? undefined,
    tagLine: profile.tagLine ?? undefined,
    summonerLevel: profile.summonerLevel ?? 0,
    profileIconId: profile.profileIconId ?? 29,
    region,
  };
}

function toRanked(solo: ProfileSnapshot['rankedSolo']): RankedInfo | null {
  if (!solo?.tier || !TIERS.has(solo.tier)) return null;
  return {
    queueType: 'RANKED_SOLO_5x5',
    tier: solo.tier as Tier,
    division: (solo.rank as RankedInfo['division']) || 'I',
    leaguePoints: solo.leaguePoints ?? 0,
    wins: solo.wins ?? 0,
    losses: solo.losses ?? 0,
  };
}

function toKpi(stats: RiotStatsPayload): KpiSummary {
  return {
    winrate: stats.winrate,
    avgKills: stats.avgKills,
    avgDeaths: stats.avgDeaths,
    avgAssists: stats.avgAssists,
    kda: stats.kda,
    avgCSPerMin: stats.avgCSPerMin,
    avgGoldDiffAt15: 0,
    tiltIndex: stats.tiltIndex,
    gamesAnalyzed: stats.gamesAnalyzed,
    lastUpdated: stats.lastUpdated,
  };
}

/**
 * Freshest data for the profile on screen: the open client when it is that
 * account, the Riot API for the linked Riot ID, else the stored snapshot.
 */
async function profileSnapshot(
  active: string,
  clientPuuid: string | null,
  linked: string | null,
  stored: StoredRiotProfile[],
): Promise<ProfileSnapshot | null> {
  const saved = stored.find((profile) => profile.puuid === active) ?? null;
  if (active === clientPuuid) {
    const client = await fetchClientProfile();
    if (client?.puuid === active) return client;
  }
  if (active === linked) {
    const cloud = await fetchLinkedProfile();
    // Without a production Riot key the API brings no rank: keep the stored one.
    if (cloud) return { ...cloud, rankedSolo: cloud.rankedSolo ?? saved?.rankedSolo ?? null };
  }
  return saved;
}

export function RiotDataBridge() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const { profileChoice } = state;

  useEffect(() => {
    if (!user) return;
    let active = true;
    let lastLoad = 0;
    const region = (user.region || 'la1') as Region;

    const load = async () => {
      lastLoad = Date.now();
      // The agent copies whatever League account is open to this analyzer account.
      const clientPuuid = await syncClientHistory();
      const { profiles, default: fallback, linked } = await fetchProfiles();
      const shown = chooseActiveProfile({
        choice: profileChoice,
        linked,
        clientPuuid,
        fallback,
        known: profiles.map((profile) => profile.puuid),
      });
      const [history, snapshot] = await Promise.all([
        fetchProfileHistory(shown),
        shown === ALL_PROFILES ? Promise.resolve(null) : profileSnapshot(shown, clientPuuid, linked, profiles),
      ]);
      if (!active) return;

      dispatch({ type: 'SET_RIOT_PROFILES', payload: { profiles, active: shown } });
      dispatch({ type: 'SET_SUMMONER', payload: snapshot ? toSummoner(snapshot, region) : null });
      dispatch({ type: 'SET_RANKED_INFO', payload: snapshot ? toRanked(snapshot.rankedSolo) : null });
      dispatch({ type: 'SET_MATCH_HISTORY', payload: history.matches as MatchRecord[] });
      dispatch({ type: 'SET_KPI', payload: toKpi(history.stats) });
      dispatch({ type: 'SET_CHAMP_PERF', payload: history.stats.champions as ChampionPerformance[] });
    };

    const run = () => {
      load().catch((error: unknown) => {
        if (active) publishAppError(error);
      });
    };
    // Runs a load unless one just started (the client answering at startup).
    const runUnlessRecent = () => {
      if (Date.now() - lastLoad >= RELOAD_GAP_MS) run();
    };

    run();
    // The app may open before League: copy the open account once the client
    // answers, and again when a finished game reaches the history.
    const stops = [eventBus.on('lcu:connected', runUnlessRecent), eventBus.on('history:updated', run)];
    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }, [dispatch, user, profileChoice]);

  return null;
}
