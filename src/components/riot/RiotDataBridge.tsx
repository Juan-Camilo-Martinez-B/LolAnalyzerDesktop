import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { BackendError, fetchRiotBundle } from '../../services/backendAuth';
import type { ChampionPerformance, KpiSummary } from '../../types/stats';
import type { MatchRecord, RankedInfo, Region, SummonerProfile, Tier } from '../../types/game';

const TIERS = new Set(['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']);

export function RiotDataBridge() {
  const { user } = useAuth();
  const { dispatch } = useApp();

  useEffect(() => {
    if (!user?.riotLinked || !user.riotGameName) return;
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
    let active = true;
    fetchRiotBundle()
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
        dispatch({ type: 'SET_MATCH_HISTORY', payload: bundle.matches as MatchRecord[] });
        dispatch({
          type: 'SET_KPI',
          payload: {
            winrate: bundle.stats.winrate,
            avgKills: bundle.stats.avgKills,
            avgDeaths: bundle.stats.avgDeaths,
            avgAssists: bundle.stats.avgAssists,
            kda: bundle.stats.kda,
            avgCSPerMin: bundle.stats.avgCSPerMin,
            avgGoldDiffAt15: 0,
            tiltIndex: bundle.stats.tiltIndex,
            gamesAnalyzed: bundle.stats.gamesAnalyzed,
            lastUpdated: bundle.stats.lastUpdated,
          } satisfies KpiSummary,
        });
        dispatch({ type: 'SET_CHAMP_PERF', payload: bundle.stats.champions as ChampionPerformance[] });
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
        const message = error instanceof BackendError ? error.message : 'Riot API no está disponible.';
        console.warn('[RiotDataBridge]', message);
      });
    return () => {
      active = false;
    };
  }, [dispatch, user]);

  return null;
}
