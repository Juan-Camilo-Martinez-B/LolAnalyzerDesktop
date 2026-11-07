import { globalShortcut } from 'electron';

/** Global chords that do not steal Ctrl+Tab or Shift+F1 from the game. */
const TOGGLE_OVERLAY = 'CommandOrControl+Shift+O';
const CYCLE_MODE = 'CommandOrControl+Shift+M';
/** Unlocks the HUD so it can be dragged; pressing it again locks it and returns focus to League. */
const EDIT_MODE = 'CommandOrControl+Shift+L';

export function registerGlobalHotkeys(handlers: {
  toggleOverlay: () => void;
  cycleMode: () => void;
  toggleEditMode: () => void;
}): void {
  globalShortcut.unregisterAll();
  const results = [
    globalShortcut.register(TOGGLE_OVERLAY, handlers.toggleOverlay),
    globalShortcut.register(CYCLE_MODE, handlers.cycleMode),
    globalShortcut.register(EDIT_MODE, handlers.toggleEditMode),
  ];
  if (results.some((ok) => !ok)) {
    console.warn('[electron] no se pudieron registrar todos los atajos del overlay');
  }
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll();
}
