import { globalShortcut } from 'electron';

/** Global chords that do not steal Ctrl+Tab or Shift+F1 from the game. */
const TOGGLE_OVERLAY = 'CommandOrControl+Shift+O';
const CYCLE_MODE = 'CommandOrControl+Shift+M';

export function registerGlobalHotkeys(handlers: {
  toggleOverlay: () => void;
  cycleMode: () => void;
}): void {
  globalShortcut.unregisterAll();
  const toggleOk = globalShortcut.register(TOGGLE_OVERLAY, handlers.toggleOverlay);
  const cycleOk = globalShortcut.register(CYCLE_MODE, handlers.cycleMode);
  if (!toggleOk || !cycleOk) {
    console.warn('[electron] no se pudieron registrar todos los atajos del overlay');
  }
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll();
}
