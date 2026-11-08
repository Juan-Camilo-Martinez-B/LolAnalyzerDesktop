import { useEffect } from 'react';
import { eventBus } from '../../services/eventBus';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fetchHistoryBundle, fetchRiotBundle, type RiotStatsPayload } from '../../services/backendAuth';
import { publishAppError } from '../../services/userErrors';
import type { ChampionPerformance, KpiSummary } from '../../types/stats';
import type { MatchRecord, RankedInfo, Region, SummonerProfile, Tier } from '../../types/game';

// A client that was already open answers right after the first load; skip that repeat.
const RELOAD_GAP_MS = 8000;

const TIERS = new Set(['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']);

export function RiotDataBridge() {
  const { user } = useAuth();
  const { dispatch } = useApp();

  useEffect(() => {
    if (!user) return;
    let active = true;
    let lastLoad = 0;
    // Runs a load unless one just started (the client answering at startup).
    const throttled = (load: () => void) => () => {
      if (Date.now() - lastLoad < RELOAD_GAP_MS) return;
      lastLoad = Date.now();
      load();
    };

    const showStats = (matches: unknown[], stats: RiotStatsPayload) => {
      dispatch({ type: 'SET_MATCH_HISTORY', payload: matches as MatchRecord[] });
      dispatch({
        type: 'SET_KPI',
        payload: {
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
        } satisfies KpiSummary,
      });
      dispatch({ type: 'SET_CHAMP_PERF', payload: stats.champions as ChampionPerformance[] });
    };

    // Without a linked Riot ID only the stored games load; the client is not copied.
    if (!user.riotLinked || !user.riotGameName) {
      const loadHistory = () => {
        fetchHistoryBundle()
          .then((bundle) => { if (active) showStats(bundle.matches, bundle.stats); })
          .catch((error: unknown) => { if (active) publishAppError(error); });
      };
      loadHistory();
      const stop = eventBus.on('history:updated', loadHistory);
      return () => {
        active = false;
        stop();
      };
    }

    const region = (user.region || 'la1') as Region;
    dispatch({
      type: 'SET_SUMMONER',
      payload: {
        puuid: '',
        summonerId: 0,
        accountId: '',
        displayName: `${user.riotGameName}#${user.riotTagLine ?? ''}`,
        gameName: user.riotGameName,
        tagLine: user.riotTagLine ?? undefined,
        summonerLevel: 0,
        profileIconId: user.summonerIconId ?? 29,
        region,
      },
    });
    const loadAll = () => fetchRiotBundle()
      .then((bundle) => {
        if (!active) return;
        const region = (bundle.profile.region || user.region || 'la1') as Region;
        const summoner: SummonerProfile = {
          puuid: bundle.profile.puuid,
          summonerId: 0,
          accountId: bundle.profile.puuid,
          displayName: `${bundle.profile.gameName ?? user.username}#${bundle.profile.tagLine ?? ''}`,
          gameName: bundle.profile.gameName ?? undefined,
          tagLine: bundle.profile.tagLine ?? undefined,
          summonerLevel: bundle.profile.summonerLevel ?? 1,
          profileIconId: bundle.profile.profileIconId ?? 1,
          region,
        };
        dispatch({ type: 'SET_SUMMONER', payload: summoner });
        showStats(bundle.matches, bundle.stats);
        const solo = bundle.profile.rankedSolo;
        if (solo?.tier && TIERS.has(solo.tier)) {
          const ranked: RankedInfo = {
            queueType: 'RANKED_SOLO_5x5',
            tier: solo.tier as Tier,
            division: (solo.rank as RankedInfo['division']) || 'I',
            leaguePoints: solo.leaguePoints ?? 0,
            wins: solo.wins ?? 0,
            losses: solo.losses ?? 0,
          };
          dispatch({ type: 'SET_RANKED_INFO', payload: ranked });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        publishAppError(error);
      });

    lastLoad = Date.now();
    void loadAll();
    // The app may open before League: copy the client's games once it answers,
    // and again when a finished game reaches the history.
    const stops = [eventBus.on('lcu:connected', throttled(() => void loadAll())), eventBus.on('history:updated', () => void loadAll())];
    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }, [dispatch, user]);

  return null;
}
