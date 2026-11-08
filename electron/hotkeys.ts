import fs from 'node:fs';
import path from 'node:path';
import { app, globalShortcut } from 'electron';
import { DEFAULT_HOTKEYS, checkHotkeyConfig, type HotkeyAction, type HotkeyConfig } from './hotkeyRules.js';
import { applyChanges, registerAll, type HotkeyState, type Registrar } from './hotkeyRegistration.js';

export type HotkeyHandlers = Record<HotkeyAction, () => void>;

export type HotkeyResult =
  | { ok: true; config: HotkeyConfig; inactive: HotkeyAction[] }
  | { ok: false; config: HotkeyConfig; inactive: HotkeyAction[]; error: string; action?: HotkeyAction };

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

/**
 * Registers the overlay shortcuts one by one: a combination held by another
 * program disables only that action, and Settings shows which one it is.
 */
export class HotkeyManager {
  private state: HotkeyState = { config: { ...DEFAULT_HOTKEYS }, inactive: [] };
  private suspended = false;
  private readonly registrar: Registrar;

  constructor(handlers: HotkeyHandlers) {
    this.registrar = {
      register: (action, accelerator) => {
        try {
          return globalShortcut.register(accelerator, handlers[action]);
        } catch {
          return false;
        }
      },
      unregister: (accelerator) => {
        try {
          globalShortcut.unregister(accelerator);
        } catch {
          // Already free.
        }
      },
    };
  }

  current(): HotkeyConfig {
    return { ...this.state.config };
  }

  inactive(): HotkeyAction[] {
    return [...this.state.inactive];
  }

  /** Registers the saved shortcuts; each taken one falls back to its default on its own. */
  start(): HotkeyResult {
    globalShortcut.unregisterAll();
    this.state = registerAll(this.registrar, readStored(), DEFAULT_HOTKEYS);
    if (this.state.inactive.length > 0) {
      console.warn(`[electron] atajos ocupados por otro programa: ${this.state.inactive.join(', ')}`);
    }
    return { ok: true, config: this.current(), inactive: this.inactive() };
  }

  /** Applies new shortcuts. A refused one keeps its previous combination. */
  apply(raw: unknown): HotkeyResult {
    const check = checkHotkeyConfig(raw);
    if (!check.ok) {
      return { ok: false, config: this.current(), inactive: this.inactive(), error: check.error, action: check.action };
    }
    if (this.suspended) this.resume();
    const outcome = applyChanges(this.registrar, this.state, check.config);
    this.state = outcome.state;
    writeStored(this.state.config);
    if (!outcome.ok) {
      return { ok: false, config: this.current(), inactive: this.inactive(), error: outcome.error, action: outcome.action };
    }
    return { ok: true, config: this.current(), inactive: this.inactive() };
  }

  /**
   * While Settings records a new combination the global shortcuts are released,
   * otherwise Windows would swallow the keys before the window sees them.
   */
  suspend(): void {
    if (this.suspended) return;
    this.suspended = true;
    globalShortcut.unregisterAll();
  }

  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.state = registerAll(this.registrar, this.state.config, this.state.config);
  }

  dispose(): void {
    globalShortcut.unregisterAll();
  }
}
