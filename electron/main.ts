import { app, BrowserWindow, ipcMain } from 'electron';
import { GameDataAgent } from './agent/gameDataAgent.js';
import { IpcChannel, canonicalWindowName, eventChannels } from './ipcChannels.js';
import { HotkeyManager } from './hotkeys.js';
import { DEFAULT_HOTKEYS } from './hotkeyRules.js';
import { OverlayController, type GamePhaseName } from './overlayController.js';
import { createAppWindows, type AppWindows } from './windows.js';

const PHASES = new Set<GamePhaseName>([
  'LOBBY',
  'MATCHMAKING',
  'CHAMP_SELECT',
  'IN_GAME',
  'END_OF_GAME',
  'NONE',
]);

let windows: AppWindows | null = null;
let overlayController: OverlayController | null = null;
let agent: GameDataAgent | null = null;
let hotkeys: HotkeyManager | null = null;
let quitting = false;

function broadcast(channel: string, payload: unknown): void {
  if (!eventChannels.has(channel)) return;
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function readPhase(payload: unknown): GamePhaseName | null {
  if (typeof payload !== 'object' || payload === null || !('phase' in payload)) return null;
  const phase = (payload as { phase?: unknown }).phase;
  return typeof phase === 'string' && PHASES.has(phase as GamePhaseName) ? phase as GamePhaseName : null;
}

function publish(channel: string, payload: unknown): void {
  if (channel === IpcChannel.gamePhase) {
    const phase = readPhase(payload);
    if (phase) overlayController?.setPhase(phase);
  }
  broadcast(channel, payload);
}

/** Only short plain fields cross into the overlay. */
function sanitizeAdvice(payload: unknown): { text: string; severity: string; category: string; at: number } | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const raw = payload as { text?: unknown; severity?: unknown; category?: unknown; at?: unknown };
  if (typeof raw.text !== 'string' || !raw.text.trim()) return null;
  return {
    text: raw.text.trim().slice(0, 240),
    severity: typeof raw.severity === 'string' ? raw.severity.slice(0, 20) : 'INFO',
    category: typeof raw.category === 'string' ? raw.category.slice(0, 20) : 'general',
    at: typeof raw.at === 'number' && Number.isFinite(raw.at) ? raw.at : Date.now(),
  };
}

function registerIpc(): void {
  ipcMain.handle(IpcChannel.windowOpen, (_event, name: unknown) => {
    const canonical = canonicalWindowName(name);
    if (!canonical || !windows) return false;
    if (canonical === 'desktop') {
      if (windows.desktop.isMinimized()) windows.desktop.restore();
      windows.desktop.show();
      return true;
    }
    if (canonical === 'background') return true;
    overlayController?.requestShow();
    return true;
  });

  ipcMain.handle(IpcChannel.windowClose, (_event, name: unknown) => {
    const canonical = canonicalWindowName(name);
    if (!canonical || !windows) return false;
    if (canonical === 'in_game_overlay') {
      overlayController?.requestHide();
      return true;
    }
    if (canonical === 'desktop') {
      windows.desktop.close();
      return true;
    }
    return true;
  });

  ipcMain.handle(IpcChannel.windowMinimize, (_event, name: unknown) => {
    const canonical = canonicalWindowName(name);
    if (canonical !== 'desktop' || !windows) return false;
    windows.desktop.minimize();
    return true;
  });

  ipcMain.handle(IpcChannel.hotkeysGet, () => ({
    config: hotkeys?.current() ?? DEFAULT_HOTKEYS,
    defaults: DEFAULT_HOTKEYS,
  }));

  // Only the desktop window (Settings) may change the global shortcuts.
  ipcMain.handle(IpcChannel.hotkeysSet, (event, config: unknown) => {
    if (!windows || !hotkeys || event.sender !== windows.desktop.webContents) {
      return { ok: false, config: hotkeys?.current() ?? DEFAULT_HOTKEYS, error: 'No disponible.' };
    }
    const result = hotkeys.apply(config);
    if (result.ok) broadcast(IpcChannel.hotkeysChanged, { config: result.config });
    return result;
  });

  ipcMain.handle(IpcChannel.overlaySetEditMode, (_event, enabled: unknown) => {
    if (typeof enabled !== 'boolean') return false;
    return overlayController?.setEditMode(enabled) ?? false;
  });

  // The desktop window owns the session; it relays coach advice to the overlay.
  ipcMain.handle(IpcChannel.coachPublish, (event, payload: unknown) => {
    if (!windows || event.sender !== windows.desktop.webContents) return false;
    if (!windows.overlay.isDestroyed()) {
      windows.overlay.webContents.send(IpcChannel.coachAdvice, sanitizeAdvice(payload));
    }
    return true;
  });

  ipcMain.handle(IpcChannel.overlayToggle, () => {
    return overlayController?.toggleUserVisibility() ?? false;
  });

  ipcMain.handle(IpcChannel.overlayGetStatus, () => {
    return overlayController?.status() ?? null;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const desktop = windows?.desktop;
    if (!desktop || desktop.isDestroyed()) return;
    if (desktop.isMinimized()) desktop.restore();
    desktop.show();
  });

  app.whenReady().then(() => {
    windows = createAppWindows();
    windows.background.webContents.setBackgroundThrottling(false);
    windows.overlay.webContents.setBackgroundThrottling(false);
    // The desktop window polls the coach and relays it to the overlay, even minimized.
    windows.desktop.webContents.setBackgroundThrottling(false);
    overlayController = new OverlayController(windows.overlay, publish);
    overlayController.start();
    agent = new GameDataAgent(publish);
    agent.start();
    registerIpc();
    hotkeys = new HotkeyManager({
      toggleOverlay: () => {
        overlayController?.toggleUserVisibility();
        broadcast(IpcChannel.hotkey, { action: 'toggle' });
      },
      cycleMode: () => {
        broadcast(IpcChannel.hotkey, { action: 'cycle-mode' });
      },
      toggleEditMode: () => {
        const controller = overlayController;
        if (controller) controller.setEditMode(!controller.isEditMode());
      },
    });
    hotkeys.start();

    // A locked overlay must never keep the keyboard (shop, abilities, chat).
    windows.overlay.on('focus', () => {
      overlayController?.returnFocusToGame();
    });

    windows.overlay.on('close', (event) => {
      if (quitting) return;
      event.preventDefault();
      overlayController?.requestHide();
    });
    windows.desktop.on('closed', () => {
      if (!quitting) app.quit();
    });
  }).catch((error: unknown) => {
    console.error('[electron] no se pudo abrir LolAnalyzer', error);
    app.quit();
  });

  app.on('before-quit', () => {
    quitting = true;
    hotkeys?.dispose();
    agent?.stop();
    overlayController?.stop();
  });
}
