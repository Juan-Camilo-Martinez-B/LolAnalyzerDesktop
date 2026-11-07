import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

/**
 * Sandboxed preload. Channel names must match electron/ipcChannels.ts.
 * Only concrete functions are exposed. ipcRenderer never reaches the page.
 */

const windowOpen = 'lol:window-open';
const windowClose = 'lol:window-close';
const windowMinimize = 'lol:window-minimize';
const overlaySetEditMode = 'lol:overlay-set-edit-mode';
const coachPublish = 'lol:coach-publish';
const overlayToggle = 'lol:overlay-toggle';
const overlayGetStatus = 'lol:overlay-get-status';
const gameTime = 'lol:game-time';
const gameEvent = 'lol:game-event';
const gamePhase = 'lol:game-phase';
const hotkey = 'lol:hotkey';
const overlayNotice = 'lol:overlay-notice';
const overlayEditMode = 'lol:overlay-edit-mode';
const playerStats = 'lol:player-stats';
const coachAdvice = 'lol:coach-advice';

const allowedEvents = new Set([
  gameTime,
  gameEvent,
  gamePhase,
  hotkey,
  overlayNotice,
  overlayEditMode,
  playerStats,
  coachAdvice,
]);

function subscribe(channel: string, listener: (payload: unknown) => void): () => void {
  if (!allowedEvents.has(channel)) {
    return () => {};
  }
  const wrapped = (_event: IpcRendererEvent, payload: unknown) => {
    listener(payload);
  };
  ipcRenderer.on(channel, wrapped);
  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
}

const api = {
  openWindow(name: string): Promise<boolean> {
    return ipcRenderer.invoke(windowOpen, name);
  },
  closeWindow(name: string): Promise<boolean> {
    return ipcRenderer.invoke(windowClose, name);
  },
  minimizeWindow(name: string): Promise<boolean> {
    return ipcRenderer.invoke(windowMinimize, name);
  },
  setOverlayEditMode(enabled: boolean): Promise<boolean> {
    return ipcRenderer.invoke(overlaySetEditMode, enabled);
  },
  publishCoachAdvice(payload: unknown): Promise<boolean> {
    return ipcRenderer.invoke(coachPublish, payload);
  },
  toggleOverlay(): Promise<boolean> {
    return ipcRenderer.invoke(overlayToggle);
  },
  getOverlayStatus(): Promise<unknown> {
    return ipcRenderer.invoke(overlayGetStatus);
  },
  onGameTime(listener: (payload: { seconds: number }) => void): () => void {
    return subscribe(gameTime, (payload) => listener(payload as { seconds: number }));
  },
  onGameEvent(listener: (payload: unknown) => void): () => void {
    return subscribe(gameEvent, listener);
  },
  onGamePhase(listener: (payload: { phase: string }) => void): () => void {
    return subscribe(gamePhase, (payload) => listener(payload as { phase: string }));
  },
  onHotkey(listener: (payload: { action: 'toggle' | 'cycle-mode' | 'edit-mode' }) => void): () => void {
    return subscribe(hotkey, (payload) => listener(payload as { action: 'toggle' | 'cycle-mode' | 'edit-mode' }));
  },
  onOverlayEditMode(listener: (payload: { enabled: boolean }) => void): () => void {
    return subscribe(overlayEditMode, (payload) => listener(payload as { enabled: boolean }));
  },
  onPlayerStats(listener: (payload: unknown) => void): () => void {
    return subscribe(playerStats, listener);
  },
  onCoachAdvice(listener: (payload: unknown) => void): () => void {
    return subscribe(coachAdvice, listener);
  },
  onOverlayNotice(listener: (payload: unknown) => void): () => void {
    return subscribe(overlayNotice, listener);
  },
};

contextBridge.exposeInMainWorld('lolAnalyzer', api);
