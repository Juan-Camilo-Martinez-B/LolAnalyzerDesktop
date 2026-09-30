// ============================================================
// LolAnalyzer - Unified App Context
// src/context/AppContext.tsx
//
// Single source of truth for the desktop window.
// Connects the eventBus → React state so every component
// can subscribe without prop drilling.
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

import type { GamePhase, SummonerProfile, RankedInfo, MatchRecord, ChampSelectSession } from '../types/game';
import type { KpiSummary, ChampionPerformance } from '../types/stats';
import type { CoachAnalytics, CoachMessage, TiltAlert, OverlayState } from '../types/coach';
import type { ConnectionStatus } from '../types/game';
import { csPerMinute } from '../services/tiltCalculations';
import { eventBus } from '../services/eventBus';
import { checkBackendHealth } from '../services/apiClient';

/* ─────────────────────────────────────────────────────────
   State shape
───────────────────────────────────────────────────────── */
export interface AppState {
  // Connection status
  lcuStatus:     ConnectionStatus;
  backendStatus: ConnectionStatus;

  // Game phase
  gamePhase: GamePhase;
  gameTimeSec: number;

  // Profile
  summoner:   SummonerProfile | null;
  rankedInfo: RankedInfo | null;

  // Stats
  kpiSummary:          KpiSummary | null;
  championPerformance: ChampionPerformance[];
  matchHistory:        MatchRecord[];

  // Coach
  coachAnalytics:      CoachAnalytics | null;
  activeCoachMessage:  CoachMessage | null;
  activeTiltAlert:     TiltAlert | null;

  // Champ select
  champSelectSession:  ChampSelectSession | null;

  // Overlay
  overlayState: OverlayState;

  // UI flags
  isLoading:       boolean;
  dataInitialized: boolean;
  activeTab:       'dashboard' | 'champ-select' | 'coach' | 'settings';
}

const initialOverlayState: OverlayState = {
  visible: false,
  mode: 'compact',
  opacity: 0.92,
  tiltAlert: null,
  activeCoachMessage: null,
  csPerMin: 0,
  csVsChallenger: 0,
  gameTime: 0,
  objectiveTimers: [],
};

export const initialState: AppState = {
  lcuStatus:           'disconnected',
  backendStatus:       'disconnected',
  gamePhase:           'NONE',
  gameTimeSec:         0,
  summoner:            null,
  rankedInfo:          null,
  kpiSummary:          null,
  championPerformance: [],
  matchHistory:        [],
  coachAnalytics:      null,
  activeCoachMessage:  null,
  activeTiltAlert:     null,
  champSelectSession:  null,
  overlayState:        initialOverlayState,
  isLoading:           false,
  dataInitialized:     false,
  activeTab:           'dashboard',
};

/* ─────────────────────────────────────────────────────────
   Actions
───────────────────────────────────────────────────────── */
type AppAction =
  | { type: 'SET_LCU_STATUS';      payload: ConnectionStatus }
  | { type: 'SET_BACKEND_STATUS';  payload: ConnectionStatus }
  | { type: 'SET_GAME_PHASE';      payload: GamePhase }
  | { type: 'SET_GAME_TIME';       payload: number }
  | { type: 'SET_SUMMONER';        payload: SummonerProfile }
  | { type: 'SET_RANKED_INFO';     payload: RankedInfo }
  | { type: 'SET_KPI';             payload: KpiSummary }
  | { type: 'SET_CHAMP_PERF';      payload: ChampionPerformance[] }
  | { type: 'SET_MATCH_HISTORY';   payload: MatchRecord[] }
  | { type: 'SET_COACH_ANALYTICS'; payload: CoachAnalytics }
  | { type: 'SET_COACH_MESSAGE';   payload: CoachMessage | null }
  | { type: 'SET_TILT_ALERT';      payload: TiltAlert | null }
  | { type: 'SET_CHAMP_SELECT';    payload: ChampSelectSession | null }
  | { type: 'SET_OVERLAY';         payload: Partial<OverlayState> }
  | { type: 'TOGGLE_OVERLAY_VISIBLE' }
  | { type: 'CYCLE_OVERLAY_MODE' }
  | { type: 'SET_LOADING';         payload: boolean }
  | { type: 'SET_INITIALIZED';     payload: boolean }
  | { type: 'SET_ACTIVE_TAB';      payload: AppState['activeTab'] };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LCU_STATUS':      return { ...state, lcuStatus: action.payload };
    case 'SET_BACKEND_STATUS':  return { ...state, backendStatus: action.payload };
    case 'SET_GAME_PHASE':      return { ...state, gamePhase: action.payload };
    case 'SET_GAME_TIME':       return { ...state, gameTimeSec: action.payload };
    case 'SET_SUMMONER':        return { ...state, summoner: action.payload };
    case 'SET_RANKED_INFO':     return { ...state, rankedInfo: action.payload };
    case 'SET_KPI':             return { ...state, kpiSummary: action.payload };
    case 'SET_CHAMP_PERF':      return { ...state, championPerformance: action.payload };
    case 'SET_MATCH_HISTORY':   return { ...state, matchHistory: action.payload };
    case 'SET_COACH_ANALYTICS': return { ...state, coachAnalytics: action.payload };
    case 'SET_COACH_MESSAGE':   return { ...state, activeCoachMessage: action.payload };
    case 'SET_TILT_ALERT':      return { ...state, activeTiltAlert: action.payload };
    case 'SET_CHAMP_SELECT':    return { ...state, champSelectSession: action.payload };
    case 'SET_OVERLAY':         return { ...state, overlayState: { ...state.overlayState, ...action.payload } };
    case 'TOGGLE_OVERLAY_VISIBLE':
      return { ...state, overlayState: { ...state.overlayState, visible: !state.overlayState.visible } };
    case 'CYCLE_OVERLAY_MODE': {
      const nextMode = state.overlayState.mode === 'expanded' ? 'compact' : 'expanded';
      return { ...state, overlayState: { ...state.overlayState, mode: nextMode, visible: true } };
    }
    case 'SET_LOADING':         return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':     return { ...state, dataInitialized: action.payload };
    case 'SET_ACTIVE_TAB':      return { ...state, activeTab: action.payload };
    default:                    return state;
  }
}

/* ─────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────── */
interface AppContextValue {
  state:    AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience setters
  setActiveTab: (tab: AppState['activeTab']) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/* ─────────────────────────────────────────────────────────
   Provider
───────────────────────────────────────────────────────── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setActiveTab = useCallback((tab: AppState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  // ── Subscribe to event bus ───────────────────────────────
  useEffect(() => {
    const unsubs = [
      eventBus.on('lcu:connected',       () => dispatch({ type: 'SET_LCU_STATUS', payload: 'connected' })),
      eventBus.on('lcu:disconnected',    () => dispatch({ type: 'SET_LCU_STATUS', payload: 'disconnected' })),
      eventBus.on('backend:sync_complete', () => dispatch({ type: 'SET_BACKEND_STATUS', payload: 'connected' })),
      eventBus.on('backend:error',       () => dispatch({ type: 'SET_BACKEND_STATUS', payload: 'error' })),

      eventBus.on('game:phase_changed', ({ phase }) =>
        dispatch({ type: 'SET_GAME_PHASE', payload: phase })),

      eventBus.on('game:time_update', ({ seconds }) => {
        dispatch({ type: 'SET_GAME_TIME', payload: seconds });
        dispatch({ type: 'SET_OVERLAY', payload: { gameTime: seconds } });
      }),

      eventBus.on('game:event', (event) => {
        if (event.type === 'cs_update' && typeof event.value === 'number') {
          dispatch({
            type: 'SET_OVERLAY',
            payload: {
              csPerMin: Number(csPerMinute(event.value, event.timestamp).toFixed(2)),
              gameTime: event.timestamp,
            },
          });
        }
      }),

      eventBus.on('champ_select:started',  session =>
        dispatch({ type: 'SET_CHAMP_SELECT', payload: session })),
      eventBus.on('champ_select:updated',  session =>
        dispatch({ type: 'SET_CHAMP_SELECT', payload: session })),
      eventBus.on('champ_select:ended',    () =>
        dispatch({ type: 'SET_CHAMP_SELECT', payload: null })),

      eventBus.on('coach:message',       msg =>
        dispatch({ type: 'SET_COACH_MESSAGE', payload: msg })),
      eventBus.on('coach:tilt_alert', alert => {
        dispatch({ type: 'SET_TILT_ALERT', payload: alert });
        dispatch({ type: 'SET_OVERLAY', payload: { tiltAlert: alert, visible: true } });
      }),
      eventBus.on('coach:tilt_cleared', () => {
        dispatch({ type: 'SET_TILT_ALERT', payload: null });
        dispatch({ type: 'SET_OVERLAY', payload: { tiltAlert: null } });
      }),

      eventBus.on('overlay:state_changed', partial =>
        dispatch({ type: 'SET_OVERLAY', payload: partial })),
      eventBus.on('overlay:toggle', () =>
        dispatch({ type: 'TOGGLE_OVERLAY_VISIBLE' })),
      eventBus.on('overlay:set_mode', ({ mode }) =>
        dispatch({ type: 'SET_OVERLAY', payload: { mode, visible: mode !== 'hidden' } })),
      eventBus.on('overlay:cycle_mode', () =>
        dispatch({ type: 'CYCLE_OVERLAY_MODE' })),
    ];

    return () => unsubs.forEach(fn => fn());
  }, []);

  // ── Backend health probe on mount ────────────────────────
  useEffect(() => {
    checkBackendHealth().then(ok => {
      dispatch({
        type: 'SET_BACKEND_STATUS',
        payload: ok ? 'connected' : 'disconnected',
      });
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   useApp hook
───────────────────────────────────────────────────────── */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
