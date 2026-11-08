/**
 * Registers each overlay shortcut on its own. Windows refuses a combination
 * that another program already holds; that must only disable that one action,
 * never the other two. Pure (the registrar is injected) so it is unit tested.
 */

import { HOTKEY_ACTIONS, HOTKEY_LABELS, type HotkeyAction, type HotkeyConfig } from './hotkeyRules.js';

export interface Registrar {
  /** True when Windows accepted the combination for this action. */
  register(action: HotkeyAction, accelerator: string): boolean;
  unregister(accelerator: string): void;
}

export interface HotkeyState {
  config: HotkeyConfig;
  /** Actions whose combination is held by another program. */
  inactive: HotkeyAction[];
}

export type ApplyOutcome =
  | { ok: true; state: HotkeyState }
  | { ok: false; state: HotkeyState; error: string; action: HotkeyAction };

/**
 * Startup: each action tries the saved combination, then its default. An action
 * whose both combinations are taken stays inactive; the rest still work.
 */
export function registerAll(registrar: Registrar, saved: HotkeyConfig, defaults: HotkeyConfig): HotkeyState {
  const config = { ...saved };
  const inactive: HotkeyAction[] = [];
  const used = new Set<string>();
  for (const action of HOTKEY_ACTIONS) {
    const candidates = [saved[action], defaults[action]].filter((accelerator, index, list) =>
      list.indexOf(accelerator) === index && !used.has(accelerator));
    const accepted = candidates.find((accelerator) => registrar.register(action, accelerator));
    if (accepted) {
      config[action] = accepted;
      used.add(accepted);
    } else {
      inactive.push(action);
    }
  }
  return { config, inactive };
}

/**
 * Settings change: only the actions whose combination changed (or that were
 * inactive) are registered again. When Windows refuses a changed one, that
 * action goes back to its previous combination and the error names it.
 */
export function applyChanges(registrar: Registrar, current: HotkeyState, next: HotkeyConfig): ApplyOutcome {
  const config = { ...current.config };
  const inactive = new Set(current.inactive);

  // Free every combination that is about to change first, so two actions can swap keys.
  const changing = HOTKEY_ACTIONS.filter((action) => next[action] !== current.config[action] || inactive.has(action));
  for (const action of changing) {
    if (!inactive.has(action)) registrar.unregister(current.config[action]);
  }

  let refused: HotkeyAction | null = null;
  for (const action of changing) {
    if (registrar.register(action, next[action])) {
      config[action] = next[action];
      inactive.delete(action);
      continue;
    }
    if (next[action] !== current.config[action]) refused ??= action;
    // Back to the previous combination when it was working.
    const restored = !current.inactive.includes(action) && registrar.register(action, current.config[action]);
    if (restored) inactive.delete(action);
    else inactive.add(action);
  }

  const state = { config, inactive: HOTKEY_ACTIONS.filter((action) => inactive.has(action)) };
  if (refused) {
    return {
      ok: false,
      state,
      action: refused,
      error: `Otro programa ya usa esa combinación para "${HOTKEY_LABELS[refused]}". Elige otra.`,
    };
  }
  return { ok: true, state };
}
