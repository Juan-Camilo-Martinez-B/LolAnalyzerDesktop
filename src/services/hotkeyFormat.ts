// ============================================================
// LolAnalyzer - Shortcut capture and labels for Settings and the HUD
// src/services/hotkeyFormat.ts
//
// Main validates every shortcut; this file only turns a key press into
// an Electron accelerator and an accelerator into readable text.
// ============================================================

export interface KeyPress {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight',
]);

/** Physical key name: KeyO -> O, Digit5 -> 5, F9 -> F9. Null for keys a shortcut cannot use. */
function keyFromCode(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  return null;
}

export type CaptureResult =
  | { kind: 'pending' }
  | { kind: 'cancel' }
  | { kind: 'invalid'; message: string }
  | { kind: 'done'; accelerator: string };

/** Turns one keydown into an accelerator. Modifiers alone keep waiting; Escape cancels. */
export function captureShortcut(press: KeyPress): CaptureResult {
  if (press.code === 'Escape') return { kind: 'cancel' };
  if (MODIFIER_CODES.has(press.code)) return { kind: 'pending' };
  const key = keyFromCode(press.code);
  if (!key) return { kind: 'invalid', message: 'Usa una letra, un número o F1–F24.' };
  const modifiers = [
    press.ctrlKey || press.metaKey ? 'CommandOrControl' : null,
    press.altKey ? 'Alt' : null,
    press.shiftKey ? 'Shift' : null,
  ].filter((part): part is string => part !== null);
  if (!modifiers.includes('CommandOrControl') && !modifiers.includes('Alt')) {
    return { kind: 'invalid', message: 'Mantén Ctrl o Alt para no robarle teclas al juego.' };
  }
  return { kind: 'done', accelerator: [...modifiers, key].join('+') };
}

/** "CommandOrControl+Shift+O" -> "Ctrl+Shift+O". */
export function formatShortcut(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => (part === 'CommandOrControl' || part === 'Control' ? 'Ctrl' : part))
    .join('+');
}
