/**
 * Rules for user-chosen global shortcuts. Pure, so main and tests share them.
 *
 * A global shortcut is swallowed system-wide, so it must never collide with a
 * League key: it needs Ctrl or Alt, and the game's own Ctrl/Alt chords are blocked.
 */

export type HotkeyAction = 'toggleOverlay' | 'cycleMode' | 'toggleEditMode';
export type HotkeyConfig = Record<HotkeyAction, string>;

export const HOTKEY_ACTIONS: HotkeyAction[] = ['toggleOverlay', 'cycleMode', 'toggleEditMode'];

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  toggleOverlay: 'CommandOrControl+Shift+O',
  cycleMode: 'CommandOrControl+Shift+M',
  toggleEditMode: 'CommandOrControl+Shift+L',
};

export const HOTKEY_LABELS: Record<HotkeyAction, string> = {
  toggleOverlay: 'Mostrar u ocultar el overlay',
  cycleMode: 'Panel compacto o expandido',
  toggleEditMode: 'Mover o fijar el overlay',
};

const MODIFIER_ORDER = ['CommandOrControl', 'Alt', 'Shift'] as const;
const MODIFIER_ALIASES: Record<string, (typeof MODIFIER_ORDER)[number]> = {
  commandorcontrol: 'CommandOrControl',
  cmdorctrl: 'CommandOrControl',
  control: 'CommandOrControl',
  ctrl: 'CommandOrControl',
  alt: 'Alt',
  shift: 'Shift',
};
const KEY_PATTERN = /^(?:[A-Z]|[0-9]|F(?:[1-9]|1[0-9]|2[0-4]))$/;

/**
 * League defaults that use Ctrl or Alt: level up Q/W/E/R, emotes and masteries,
 * FPS display, scoreboard and window close. Stored in normalized form.
 */
const GAME_RESERVED = new Set([
  'CommandOrControl+Q', 'CommandOrControl+W', 'CommandOrControl+E', 'CommandOrControl+R',
  'CommandOrControl+1', 'CommandOrControl+2', 'CommandOrControl+3', 'CommandOrControl+4',
  'CommandOrControl+5', 'CommandOrControl+6', 'CommandOrControl+F', 'CommandOrControl+A',
  'Alt+F4',
]);

export type AcceleratorCheck = { ok: true; accelerator: string } | { ok: false; error: string };

/** Normalizes "ctrl+shift+o" to "CommandOrControl+Shift+O" and checks the rules. */
export function checkAccelerator(raw: unknown): AcceleratorCheck {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'Elige una combinación de teclas.' };
  const parts = raw.split('+').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2 || parts.length > 4) {
    return { ok: false, error: 'Usa una o dos teclas modificadoras más una tecla.' };
  }
  const key = parts[parts.length - 1].toUpperCase();
  if (!KEY_PATTERN.test(key)) return { ok: false, error: 'La tecla final debe ser una letra, un número o F1–F24.' };

  const modifiers = new Set<(typeof MODIFIER_ORDER)[number]>();
  for (const part of parts.slice(0, -1)) {
    const modifier = MODIFIER_ALIASES[part.toLowerCase()];
    if (!modifier) return { ok: false, error: `"${part}" no es una tecla modificadora válida.` };
    if (modifiers.has(modifier)) return { ok: false, error: 'Hay una tecla modificadora repetida.' };
    modifiers.add(modifier);
  }
  if (!modifiers.has('CommandOrControl') && !modifiers.has('Alt')) {
    return { ok: false, error: 'Incluye Ctrl o Alt para no robarle teclas al juego ni al chat.' };
  }

  const accelerator = [...MODIFIER_ORDER.filter((m) => modifiers.has(m)), key].join('+');
  if (GAME_RESERVED.has(accelerator)) {
    return { ok: false, error: 'League ya usa esa combinación. Elige otra.' };
  }
  return { ok: true, accelerator };
}

export type ConfigCheck =
  | { ok: true; config: HotkeyConfig }
  | { ok: false; error: string; action?: HotkeyAction };

/** Validates the three shortcuts together: each valid and none repeated. */
export function checkHotkeyConfig(raw: unknown): ConfigCheck {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Configuración de atajos inválida.' };
  const source = raw as Partial<Record<HotkeyAction, unknown>>;
  const config = {} as HotkeyConfig;
  const used = new Map<string, HotkeyAction>();
  for (const action of HOTKEY_ACTIONS) {
    const check = checkAccelerator(source[action]);
    if (!check.ok) return { ok: false, error: check.error, action };
    const other = used.get(check.accelerator);
    if (other) {
      return { ok: false, error: `Ese atajo ya está asignado a "${HOTKEY_LABELS[other]}".`, action };
    }
    used.set(check.accelerator, action);
    config[action] = check.accelerator;
  }
  return { ok: true, config };
}
