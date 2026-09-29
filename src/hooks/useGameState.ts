// ============================================================
// LolAnalyzer - Custom Hooks
// src/hooks/useGameState.ts
// ============================================================

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { KpiSummary, ChampionPerformance, MatchTelemetry } from '../types/stats';
import type { MatchRecord } from '../types/game';
import type { CoachAnalytics } from '../types/coach';
import {
  fetchKpiSummary,
  fetchChampionPerformance,
  fetchMatchHistory,
  fetchCoachAnalytics,
  fetchMatchTelemetry,
} from '../services/apiClient';

/** Access game phase and time */
export function useGamePhase() {
  const { state } = useApp();
  return {
    phase:      state.gamePhase,
    timeSec:    state.gameTimeSec,
    isInGame:   state.gamePhase === 'IN_GAME',
    isChampSel: state.gamePhase === 'CHAMP_SELECT',
    isIdle:     state.gamePhase === 'NONE' || state.gamePhase === 'LOBBY',
  };
}

/** Access connection statuses */
export function useConnectionStatus() {
  const { state } = useApp();
  return {
    lcu:         state.lcuStatus,
    backend:     state.backendStatus,
    allOnline:   state.lcuStatus === 'connected' && state.backendStatus === 'connected',
  };
}

/** Access summoner profile */
export function useSummoner() {
  const { state } = useApp();
  return { summoner: state.summoner, rankedInfo: state.rankedInfo };
}

/** Access KPI data and trigger a refresh */
export function useKpi() {
  const { state, dispatch } = useApp();

  const refresh = useCallback(async () => {
    if (!state.summoner) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const kpi = await fetchKpiSummary(state.summoner.puuid);
      dispatch({ type: 'SET_KPI', payload: kpi });
    } catch (err) {
      console.error('[useKpi] fetch failed:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.summoner, dispatch]);

  return { kpi: state.kpiSummary, refresh };
}

/** Access champion performance list */
export function useChampionPerformance() {
  const { state, dispatch } = useApp();

  const refresh = useCallback(async () => {
    if (!state.summoner) return;
    try {
      const data = await fetchChampionPerformance(state.summoner.puuid);
      dispatch({ type: 'SET_CHAMP_PERF', payload: data });
    } catch (err) {
      console.error('[useChampionPerformance] fetch failed:', err);
    }
  }, [state.summoner, dispatch]);

  return { champions: state.championPerformance, refresh };
}

/** Access match history */
export function useMatchHistory() {
  const { state, dispatch } = useApp();

  const refresh = useCallback(async (limit = 20) => {
    if (!state.summoner) return;
    try {
      const matches = await fetchMatchHistory(state.summoner.puuid, limit);
      dispatch({ type: 'SET_MATCH_HISTORY', payload: matches });
    } catch (err) {
      console.error('[useMatchHistory] fetch failed:', err);
    }
  }, [state.summoner, dispatch]);

  return { matches: state.matchHistory, refresh };
}

/** Access match telemetry for drilldown — lazy loaded per match */
export function useMatchTelemetry() {
  const fetchTelemetry = useCallback(async (matchId: string): Promise<MatchTelemetry | null> => {
    try {
      return await fetchMatchTelemetry(matchId);
    } catch {
      return null;
    }
  }, []);

  return { fetchTelemetry };
}

/** Access AI Coach analytics */
export function useCoachAnalytics() {
  const { state, dispatch } = useApp();

  const refresh = useCallback(async () => {
    if (!state.summoner) return;
    try {
      const data = await fetchCoachAnalytics(state.summoner.puuid);
      dispatch({ type: 'SET_COACH_ANALYTICS', payload: data });
    } catch (err) {
      console.error('[useCoachAnalytics] fetch failed:', err);
    }
  }, [state.summoner, dispatch]);

  return {
    analytics:    state.coachAnalytics,
    activeMessage: state.activeCoachMessage,
    refresh,
  };
}

/** Access tilt state */
export function useTilt() {
  const { state } = useApp();
  return {
    alert:     state.activeTiltAlert,
    tiltIndex: state.activeTiltAlert?.tiltIndex ?? state.kpiSummary?.tiltIndex ?? 0,
    isTilted:  (state.activeTiltAlert?.level === 'high' || state.activeTiltAlert?.level === 'critical'),
  };
}

/** Access champ select session */
export function useChampSelect() {
  const { state } = useApp();
  return {
    session:   state.champSelectSession,
    isActive:  state.champSelectSession !== null,
    myTeam:    state.champSelectSession?.myTeam ?? [],
    theirTeam: state.champSelectSession?.theirTeam ?? [],
  };
}

/** Access overlay state */
export function useOverlay() {
  const { state, dispatch } = useApp();

  const setMode = useCallback((mode: 'compact' | 'expanded' | 'hidden') => {
    dispatch({ type: 'SET_OVERLAY', payload: { mode } });
  }, [dispatch]);

  const setVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_OVERLAY', payload: { visible } });
  }, [dispatch]);

  return {
    overlay:    state.overlayState,
    setMode,
    setVisible,
  };
}

/** Initialize all data after login */
export function useDataInitializer() {
  const { state, dispatch } = useApp();

  const initialize = useCallback(async () => {
    if (!state.summoner || state.dataInitialized) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [kpi, champions, matches, coach] = await Promise.allSettled([
        fetchKpiSummary(state.summoner.puuid),
        fetchChampionPerformance(state.summoner.puuid),
        fetchMatchHistory(state.summoner.puuid),
        fetchCoachAnalytics(state.summoner.puuid),
      ]);

      if (kpi.status       === 'fulfilled') dispatch({ type: 'SET_KPI',             payload: kpi.value as KpiSummary });
      if (champions.status === 'fulfilled') dispatch({ type: 'SET_CHAMP_PERF',      payload: champions.value as ChampionPerformance[] });
      if (matches.status   === 'fulfilled') dispatch({ type: 'SET_MATCH_HISTORY',   payload: matches.value as MatchRecord[] });
      if (coach.status     === 'fulfilled') dispatch({ type: 'SET_COACH_ANALYTICS', payload: coach.value as CoachAnalytics });

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.summoner, state.dataInitialized, dispatch]);

  return { initialize, isLoading: state.isLoading, isReady: state.dataInitialized };
}
