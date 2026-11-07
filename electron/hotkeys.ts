import fs from 'node:fs';
import path from 'node:path';
import { app, globalShortcut } from 'electron';
import {
  DEFAULT_HOTKEYS,
  HOTKEY_ACTIONS,
  HOTKEY_LABELS,
  checkHotkeyConfig,
  type HotkeyAction,
  type HotkeyConfig,
} from './hotkeyRules.js';

export type HotkeyHandlers = Record<HotkeyAction, () => void>;

export type HotkeyResult =
  | { ok: true; config: HotkeyConfig }
  | { ok: false; config: HotkeyConfig; error: string; action?: HotkeyAction };

/** The player's shortcuts live next to the app data, so main can register them before any window loads. */
function storePath(): string {
  return path.join(app.getPath('userData'), 'hotkeys.json');
}

function readStored(): HotkeyConfig {
  try {
    const raw = JSON.parse(fs.readFileSync(storePath(), 'utf8')) as unknown;
    const check = checkHotkeyConfig(raw);
    return check.ok ? check.config : DEFAULT_HOTKEYS;
  } catch {
    return DEFAULT_HOTKEYS;
  }
}

function writeStored(config: HotkeyConfig): void {
  try {
    fs.mkdirSync(path.dirname(storePath()), { recursive: true });
    fs.writeFileSync(storePath(), JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.warn('[electron] no se pudieron guardar los atajos', error);
  }
}

/** Registers the overlay shortcuts and swaps them safely when the player changes one. */
export class HotkeyManager {
  private config: HotkeyConfig = DEFAULT_HOTKEYS;

  constructor(private readonly handlers: HotkeyHandlers) {}

  current(): HotkeyConfig {
    return { ...this.config };
  }

  /** Registers the saved shortcuts, or the defaults when one of them is taken. */
  start(): HotkeyConfig {
    const stored = readStored();
    const failed = this.register(stored);
    if (failed) {
      console.warn(`[electron] el atajo de "${HOTKEY_LABELS[failed]}" está ocupado; se usan los predeterminados`);
      this.register(DEFAULT_HOTKEYS);
    }
    return this.current();
  }

  /** Applies new shortcuts. If Windows refuses one, the previous set stays active. */
  apply(raw: unknown): HotkeyResult {
    const check = checkHotkeyConfig(raw);
    if (!check.ok) return { ok: false, config: this.current(), error: check.error, action: check.action };

    const previous = this.current();
    const failed = this.register(check.config);
    if (failed) {
      this.register(previous);
      return {
        ok: false,
        config: this.current(),
        error: 'Otro programa ya usa ese atajo. Elige otra combinación.',
        action: failed,
      };
    }
    writeStored(this.config);
    return { ok: true, config: this.current() };
  }

  dispose(): void {
    globalShortcut.unregisterAll();
  }

  /** Returns the first action that could not be registered, or null when all worked. */
  private register(config: HotkeyConfig): HotkeyAction | null {
    globalShortcut.unregisterAll();
    for (const action of HOTKEY_ACTIONS) {
      let ok = false;
      try {
        ok = globalShortcut.register(config[action], this.handlers[action]);
      } catch {
        ok = false;
      }
      if (!ok) {
        globalShortcut.unregisterAll();
        return action;
      }
    }
    this.config = { ...config };
    return null;
  }
}
