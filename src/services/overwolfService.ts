// ============================================================
// LolAnalyzer - Overwolf Window Controller & Game Event Bridge
// src/services/overwolfService.ts
//
// In a real Overwolf build this file calls the overwolf.* SDK.
// In dev/browser mode it falls back gracefully so you can work
// without the Overwolf runtime.
// ============================================================

import type { GamePhase, LiveGameEvent, ChampSelectSession } from '../types/game';
import type { TiltAlert, CoachMessage } from '../types/coach';
import type { OverlayAnchor } from './settingsStore';
import { eventBus } from './eventBus';

const OVERLAY_NOTICE_KEY = 'lolanalyzer.overlayNotice.v1';
const GAME_PHASES = new Set<GamePhase>(['LOBBY', 'MATCHMAKING', 'CHAMP_SELECT', 'IN_GAME', 'END_OF_GAME', 'NONE']);
const LIVE_EVENT_TYPES = new Set<LiveGameEvent['type']>([
  'kill', 'death', 'assist', 'objective', 'cs_update', 'gold_update', 'game_start', 'game_end',
]);

interface ElectronNotice {
  code: 'exclusive-fullscreen' | null;
  message: string;
  windowMode: 0 | 1 | 2 | null;
  updatedAt: number;
}

interface ElectronStatus {
  phase?: string | null;
  notice?: ElectronNotice;
}

interface LolAnalyzerBridge {
  openWindow(name: string): Promise<boolean>;
  closeWindow(name: string): Promise<boolean>;
  minimizeWindow(name: string): Promise<boolean>;
  setOverlayEditMode(enabled: boolean): Promise<boolean>;
  publishCoachAdvice(payload: OverlayCoachAdvice): Promise<boolean>;
  getHotkeys(): Promise<unknown>;
  setHotkeys(config: unknown): Promise<unknown>;
  suspendHotkeys(suspended: boolean): Promise<boolean>;
  onHotkeysChanged(listener: (payload: unknown) => void): () => void;
  toggleOverlay(): Promise<boolean>;
  getOverlayStatus(): Promise<ElectronStatus | null>;
  onGameTime(listener: (payload: { seconds: number }) => void): () => void;
  onGameEvent(listener: (payload: unknown) => void): () => void;
  onGamePhase(listener: (payload: { phase: string }) => void): () => void;
  onHotkey(listener: (payload: { action: 'toggle' | 'cycle-mode' | 'edit-mode' }) => void): () => void;
  onOverlayNotice(listener: (payload: unknown) => void): () => void;
  onOverlayEditMode(listener: (payload: { enabled: boolean }) => void): () => void;
  onPlayerStats(listener: (payload: unknown) => void): () => void;
  onCoachAdvice(listener: (payload: unknown) => void): () => void;
}

/** Local player summary sent by the Electron live-client agent. */
export interface OverlayPlayerStats {
  championName: string | null;
  position: string | null;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  currentGold: number;
  gameTime: number;
}

/** Coach tip relayed from the desktop window, which owns the session. */
export interface OverlayCoachAdvice {
  text: string;
  /** INFO, WARNING or CRITICAL. */
  severity: string;
  /** recall, death, objective, economy, vision, tilt, farm or general. */
  category?: string;
  at: number;
}

declare global {
  interface Window {
    lolAnalyzer?: LolAnalyzerBridge;
  }
}

/* ─────────────────────────────────────────────────────────
   Window name constants (must match manifest.json)
───────────────────────────────────────────────────────── */
export const WINDOW = {
  BACKGROUND: 'background',
  DESKTOP:    'desktop',
  OVERLAY:    'in_game_overlay',
} as const;

/* ─────────────────────────────────────────────────────────
   Runtime detection
───────────────────────────────────────────────────────── */
const isElectronRuntime = (): boolean =>
  typeof window !== 'undefined' && typeof window.lolAnalyzer !== 'undefined';

const isOverwolf = (): boolean => {
  if (isElectronRuntime()) return false;
  return typeof window !== 'undefined' &&
    typeof (window as { overwolf?: unknown }).overwolf !== 'undefined';
};

function electronBridge(): LolAnalyzerBridge | null {
  return isElectronRuntime() ? window.lolAnalyzer ?? null : null;
}

function canonicalWindow(name: string): string {
  return name === 'overlay' ? WINDOW.OVERLAY : name;
}

function isGamePhase(phase: string): phase is GamePhase {
  return GAME_PHASES.has(phase as GamePhase);
}

function isLiveEvent(value: unknown): value is LiveGameEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as LiveGameEvent;
  return LIVE_EVENT_TYPES.has(event.type) && typeof event.timestamp === 'number';
}

function rememberNotice(notice: unknown): void {
  if (!notice || typeof notice !== 'object') return;
  try {
    localStorage.setItem(OVERLAY_NOTICE_KEY, JSON.stringify(notice));
  } catch {
    // Private mode or a blocked storage must not break the overlay.
  }
}

let electronBridgeStarted = false;

function ensureElectronBridge(): void {
  const api = electronBridge();
  if (!api || electronBridgeStarted) return;
  electronBridgeStarted = true;
  api.onGameTime(({ seconds }) => {
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      eventBus.emit('game:time_update', { seconds });
    }
  });
  api.onGameEvent((payload) => {
    if (isLiveEvent(payload)) eventBus.emit('game:event', payload);
  });
  api.onGamePhase(({ phase }) => {
    if (isGamePhase(phase)) eventBus.emit('game:phase_changed', { phase });
  });
  api.onHotkey(({ action }) => {
    if (action === 'cycle-mode') eventBus.emit('overlay:cycle_mode');
  });
  api.onOverlayNotice((notice) => rememberNotice(notice));
  void api.getOverlayStatus().then((status) => {
    if (!status) return;
    rememberNotice(status.notice);
    if (status.phase && isGamePhase(status.phase)) {
      eventBus.emit('game:phase_changed', { phase: status.phase });
    }
  }).catch(() => {});
}

if (typeof window !== 'undefined') ensureElectronBridge();

/* ─────────────────────────────────────────────────────────
   Window Management
───────────────────────────────────────────────────────── */
export async function getWindowId(windowName: string): Promise<string | null> {
  if (!isOverwolf()) return null;
  return new Promise(resolve => {
    overwolf.windows.obtainDeclaredWindow(windowName, result => {
      resolve(result.success ? result.window.id : null);
    });
  });
}

export async function openWindow(windowName: string): Promise<boolean> {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    return electronBridge()!.openWindow(canonicalWindow(windowName));
  }
  if (!isOverwolf()) {
    console.log(`[OW] openWindow: ${windowName} (dev mode - no-op)`);
    return true;
  }
  const id = await getWindowId(windowName);
  if (!id) return false;
  return new Promise(resolve => {
    overwolf.windows.restore(id, result => resolve(result.success ?? false));
  });
}

export async function closeWindow(windowName: string): Promise<boolean> {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    return electronBridge()!.closeWindow(canonicalWindow(windowName));
  }
  if (!isOverwolf()) return true;
  const id = await getWindowId(windowName);
  if (!id) return false;
  return new Promise(resolve => {
    overwolf.windows.close(id, result => resolve(result.success ?? false));
  });
}

export async function minimizeWindow(windowName: string): Promise<boolean> {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    return electronBridge()!.minimizeWindow(canonicalWindow(windowName));
  }
  if (!isOverwolf()) return true;
  const id = await getWindowId(windowName);
  if (!id) return false;
  return new Promise(resolve => {
    overwolf.windows.minimize(id, result => resolve(result.success ?? false));
  });
}

export async function toggleOverlay(): Promise<void> {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    await electronBridge()!.toggleOverlay();
    return;
  }
  if (!isOverwolf()) {
    eventBus.emit('overlay:toggle');
    return;
  }
  const id = await getWindowId(WINDOW.OVERLAY);
  if (!id) return;
  overwolf.windows.getWindowState(id, result => {
    if (result.window_state_ex === 'normal') {
      overwolf.windows.hide(id, () => {});
    } else {
      overwolf.windows.restore(id, () => {});
    }
  });
}

/** HUD-safe anchors. Top-right and bottom-center stay clear of the scoreboard and spell bar. */
const OVERLAY_ANCHORS: Record<OverlayAnchor, { left: number; top: number }> = {
  'top-left':    { left: 20, top: 120 },
  'top-center':  { left: 760, top: 24 },
  'bottom-left': { left: 20, top: 640 },
};

export type HotkeyAction = 'toggleOverlay' | 'cycleMode' | 'toggleEditMode';
export type HotkeyConfig = Record<HotkeyAction, string>;

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  toggleOverlay: 'CommandOrControl+Shift+O',
  cycleMode: 'CommandOrControl+Shift+M',
  toggleEditMode: 'CommandOrControl+Shift+L',
};

export type HotkeySaveResult = {
  ok: boolean;
  config: HotkeyConfig;
  /** Actions whose combination another program holds; they do nothing until changed. */
  inactive: HotkeyAction[];
  error?: string;
  action?: HotkeyAction;
};

export interface HotkeyStatus {
  config: HotkeyConfig;
  inactive: HotkeyAction[];
}

function inactiveList(value: unknown): HotkeyAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is HotkeyAction =>
    item === 'toggleOverlay' || item === 'cycleMode' || item === 'toggleEditMode');
}

function isHotkeyConfig(value: unknown): value is HotkeyConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<HotkeyConfig>;
  return (['toggleOverlay', 'cycleMode', 'toggleEditMode'] as const).every((key) => typeof config[key] === 'string');
}

/** Current global shortcuts from the main process; the defaults outside Electron. */
export async function getHotkeys(): Promise<HotkeyStatus> {
  const api = electronBridge();
  if (!api) return { config: DEFAULT_HOTKEYS, inactive: [] };
  const body = await api.getHotkeys().catch(() => null) as { config?: unknown; inactive?: unknown } | null;
  return {
    config: isHotkeyConfig(body?.config) ? body.config : DEFAULT_HOTKEYS,
    inactive: inactiveList(body?.inactive),
  };
}

/** Releases the global shortcuts while Settings records a new combination. */
export async function suspendHotkeys(suspended: boolean): Promise<void> {
  const api = electronBridge();
  if (!api) return;
  await api.suspendHotkeys(suspended).catch(() => false);
}

/** Asks main to register new shortcuts. Main validates them and keeps the old set on failure. */
export async function saveHotkeys(config: HotkeyConfig): Promise<HotkeySaveResult> {
  const api = electronBridge();
  if (!api) return { ok: false, config, inactive: [], error: 'Los atajos solo se pueden cambiar en la app de escritorio.' };
  const body = await api.setHotkeys(config).catch(() => null) as Partial<HotkeySaveResult> | null;
  if (!body || !isHotkeyConfig(body.config)) {
    return { ok: false, config, inactive: [], error: 'No se pudieron guardar los atajos.' };
  }
  return { ok: Boolean(body.ok), config: body.config, inactive: inactiveList(body.inactive), error: body.error, action: body.action };
}

export function subscribeHotkeys(listener: (status: HotkeyStatus) => void): () => void {
  const api = electronBridge();
  if (!api) return () => {};
  return api.onHotkeysChanged((payload) => {
    const body = payload as { config?: unknown; inactive?: unknown } | null;
    if (isHotkeyConfig(body?.config)) listener({ config: body.config, inactive: inactiveList(body.inactive) });
  });
}

/** True inside the Electron app (desktop or overlay window). */
export function isElectronApp(): boolean {
  return isElectronRuntime();
}

/** Locks or unlocks the HUD. Unlocked, the overlay takes the mouse so it can be dragged. */
export async function setOverlayEditMode(enabled: boolean): Promise<boolean> {
  const api = electronBridge();
  if (!api) return false;
  return api.setOverlayEditMode(enabled);
}

/** Desktop window only: forwards the latest coach tip to the overlay. */
export function publishCoachToOverlay(advice: OverlayCoachAdvice | null): void {
  const api = electronBridge();
  if (!api) return;
  void api.publishCoachAdvice(advice as OverlayCoachAdvice).catch(() => {});
}

function isPlayerStats(value: unknown): value is OverlayPlayerStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Partial<OverlayPlayerStats>;
  return ['level', 'kills', 'deaths', 'assists', 'creepScore', 'currentGold', 'gameTime']
    .every((key) => typeof stats[key as keyof OverlayPlayerStats] === 'number');
}

function isCoachAdvice(value: unknown): value is OverlayCoachAdvice {
  if (!value || typeof value !== 'object') return false;
  const advice = value as Partial<OverlayCoachAdvice>;
  return typeof advice.text === 'string' && typeof advice.at === 'number';
}

export interface OverlayLiveListeners {
  onStats(stats: OverlayPlayerStats | null): void;
  onAdvice(advice: OverlayCoachAdvice | null): void;
  onEditMode(enabled: boolean): void;
}

/** Subscribes the overlay to live stats, relayed advice and edit mode. No-op outside Electron. */
export function subscribeOverlayLive(listeners: OverlayLiveListeners): () => void {
  const api = electronBridge();
  if (!api) return () => {};
  const stops = [
    api.onPlayerStats((payload) => listeners.onStats(isPlayerStats(payload) ? payload : null)),
    api.onCoachAdvice((payload) => listeners.onAdvice(isCoachAdvice(payload) ? payload : null)),
    api.onOverlayEditMode(({ enabled }) => listeners.onEditMode(Boolean(enabled))),
  ];
  return () => stops.forEach((stop) => stop());
}

export function placeOverlay(anchor: OverlayAnchor): void {
  if (isElectronRuntime() || !isOverwolf()) return;
  const pos = OVERLAY_ANCHORS[anchor];
  overwolf.windows.changePosition(WINDOW.OVERLAY, pos.left, pos.top, () => {});
}

/* ─────────────────────────────────────────────────────────
   Overwolf Hotkeys
───────────────────────────────────────────────────────── */
/**
 * Binds overlay hotkeys.
 * Overwolf: manifest keys `toggle_overlay` (Ctrl+Tab) and `toggle_compact_mode` (Shift+F1).
 * Browser: the same chords, plus Shift+` as an alternate visibility toggle.
 * Must run inside the overlay window so compact-mode updates hit that window's state.
 */
export function registerHotkeys(): () => void {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    return () => {};
  }
  if (isOverwolf()) {
    const listener = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === 'toggle_overlay') {
        void toggleOverlay();
      }
      if (event.name === 'toggle_compact_mode') {
        eventBus.emit('overlay:cycle_mode');
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(listener);
    return () => overwolf.settings.hotkeys.onPressed.removeListener(listener);
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const toggleVisibility =
      ((event.ctrlKey || event.metaKey) && event.key === 'Tab') ||
      (event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'Backquote');
    const toggleCompact =
      event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && event.code === 'F1';

    if (!toggleVisibility && !toggleCompact) return;
    event.preventDefault();

    if (toggleVisibility) {
      void toggleOverlay();
      return;
    }
    eventBus.emit('overlay:cycle_mode');
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}

/* ─────────────────────────────────────────────────────────
   LoL Game Events listener
───────────────────────────────────────────────────────── */
const LOL_GAME_CLASS_ID = 5426; // Overwolf LoL class ID

export function registerGameEventListener(): void {
  if (isElectronRuntime()) {
    ensureElectronBridge();
    return;
  }
  if (!isOverwolf()) {
    console.log('[OW] registerGameEventListener: dev mode, using simulator');
    return;
  }

  overwolf.games.events.setRequiredFeatures(
    ['kill', 'death', 'assist', 'gold', 'minions', 'jungle', 'timers', 'game_info'],
    result => {
      if (!result.success) {
        console.error('[OW] setRequiredFeatures failed:', result.error);
      }
    }
  );

  overwolf.games.events.onNewEvents.addListener(({ events }) => {
    events.forEach(e => {
      const liveEvent: LiveGameEvent = {
        type: mapEventType(e.name),
        timestamp: Date.now(),
        value: e.data ? (typeof e.data === 'object' ? undefined : Number(e.data)) : undefined,
        meta: typeof e.data === 'object' ? (e.data as Record<string, unknown>) : undefined,
      };
      eventBus.emit('game:event', liveEvent);
    });
  });

  overwolf.games.events.onInfoUpdates2.addListener(({ feature, info }) => {
    if (feature === 'game_info') {
      const gameInfo = info as { game_info?: { phase?: string; gameTime?: number } };
      if (gameInfo?.game_info?.phase) {
        eventBus.emit('game:phase_changed', {
          phase: mapGamePhase(gameInfo.game_info.phase),
        });
      }
      if (gameInfo?.game_info?.gameTime !== undefined) {
        eventBus.emit('game:time_update', { seconds: gameInfo.game_info.gameTime });
      }
    }
  });

  overwolf.games.onGameLaunched.addListener(info => {
    if (info.classId === LOL_GAME_CLASS_ID) {
      eventBus.emit('game:connected');
    }
  });

  overwolf.games.onGameInfoUpdated.addListener(res => {
    if (!res.gameInfo?.isRunning && res.runningChanged) {
      eventBus.emit('game:disconnected');
    }
  });
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function mapEventType(name: string): LiveGameEvent['type'] {
  const map: Record<string, LiveGameEvent['type']> = {
    kill:       'kill',
    death:      'death',
    assist:     'assist',
    minions:    'cs_update',
    jungle:     'cs_update',
    gold:       'gold_update',
    game_start: 'game_start',
    game_end:   'game_end',
  };
  return map[name] ?? 'cs_update';
}

function mapGamePhase(phase: string): GamePhase {
  const map: Record<string, GamePhase> = {
    InProgress:    'IN_GAME',
    ChampSelect:   'CHAMP_SELECT',
    Lobby:         'LOBBY',
    Matchmaking:   'MATCHMAKING',
    EndOfGame:     'END_OF_GAME',
    None:          'NONE',
  };
  return map[phase] ?? 'NONE';
}

/* ─────────────────────────────────────────────────────────
   Inter-window messaging (send from background -> desktop/overlay)
───────────────────────────────────────────────────────── */
export async function sendToWindow(
  windowName: string,
  payload: {
    type: 'phase' | 'tilt_alert' | 'coach_message' | 'champ_select' | 'game_event';
    data: GamePhase | TiltAlert | CoachMessage | ChampSelectSession | LiveGameEvent;
  }
): Promise<void> {
  if (!isOverwolf()) {
    // Dev mode: just fire the event locally
    console.log(`[OW] sendToWindow(${windowName}):`, payload);
    return;
  }
  const id = await getWindowId(windowName);
  if (!id) return;
  overwolf.windows.sendMessage(id, 'lol_analyzer_msg', JSON.stringify(payload), () => {});
}

export function listenForWindowMessages(
  onMessage: (payload: { type: string; data: unknown }) => void
): void {
  if (!isOverwolf()) return;
  overwolf.windows.onMessageReceived.addListener(message => {
    try {
      const parsed = JSON.parse(message.content as string) as { type: string; data: unknown };
      onMessage(parsed);
    } catch {
      // ignore malformed
    }
  });
}

export const overwolfService = {
  isOverwolfAvailable: isOverwolf,
  registerGameEvents: registerGameEventListener,
  obtainDeclaredWindow: getWindowId,
  restoreWindow: openWindow,
  closeWindow,
  sendToWindow,
  listenForWindowMessages,
};
