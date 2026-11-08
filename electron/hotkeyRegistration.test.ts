import { describe, expect, it } from 'vitest';
import { applyChanges, registerAll, type Registrar } from './hotkeyRegistration';
import { DEFAULT_HOTKEYS } from './hotkeyRules';

/** Fake Windows: some combinations belong to another program. */
function fakeRegistrar(takenByOthers: string[]): Registrar & { held: Set<string> } {
  const held = new Set<string>();
  return {
    held,
    register(_action, accelerator) {
      if (takenByOthers.includes(accelerator) || held.has(accelerator)) return false;
      held.add(accelerator);
      return true;
    },
    unregister(accelerator) {
      held.delete(accelerator);
    },
  };
}

describe('overlay shortcut registration', () => {
  it('keeps the other shortcuts working when one is taken', () => {
    const registrar = fakeRegistrar(['CommandOrControl+Shift+O']);
    const state = registerAll(registrar, DEFAULT_HOTKEYS, DEFAULT_HOTKEYS);
    expect(state.inactive).toEqual(['toggleOverlay']);
    expect(registrar.held).toEqual(new Set(['CommandOrControl+Shift+M', 'CommandOrControl+Shift+L']));
  });

  it('falls back to the default when a saved shortcut is taken', () => {
    const registrar = fakeRegistrar(['Alt+Shift+K']);
    const state = registerAll(registrar, { ...DEFAULT_HOTKEYS, toggleEditMode: 'Alt+Shift+K' }, DEFAULT_HOTKEYS);
    expect(state.config.toggleEditMode).toBe('CommandOrControl+Shift+L');
    expect(state.inactive).toEqual([]);
  });

  it('changes one shortcut even while another one is taken', () => {
    const registrar = fakeRegistrar(['CommandOrControl+Shift+O']);
    const start = registerAll(registrar, DEFAULT_HOTKEYS, DEFAULT_HOTKEYS);
    const outcome = applyChanges(registrar, start, { ...DEFAULT_HOTKEYS, toggleOverlay: 'Alt+Shift+O' });
    expect(outcome.ok).toBe(true);
    expect(outcome.state.inactive).toEqual([]);
    expect(registrar.held.has('Alt+Shift+O')).toBe(true);
  });

  it('names the refused shortcut and keeps the previous one', () => {
    const registrar = fakeRegistrar(['Alt+Shift+K']);
    const start = registerAll(registrar, DEFAULT_HOTKEYS, DEFAULT_HOTKEYS);
    const outcome = applyChanges(registrar, start, { ...DEFAULT_HOTKEYS, toggleEditMode: 'Alt+Shift+K' });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.action).toBe('toggleEditMode');
    expect(outcome.state.config.toggleEditMode).toBe('CommandOrControl+Shift+L');
    expect(registrar.held.has('CommandOrControl+Shift+L')).toBe(true);
  });

  it('lets two actions swap their keys', () => {
    const registrar = fakeRegistrar([]);
    const start = registerAll(registrar, DEFAULT_HOTKEYS, DEFAULT_HOTKEYS);
    const swapped = { ...DEFAULT_HOTKEYS, toggleOverlay: DEFAULT_HOTKEYS.cycleMode, cycleMode: DEFAULT_HOTKEYS.toggleOverlay };
    const outcome = applyChanges(registrar, start, swapped);
    expect(outcome.ok).toBe(true);
    expect(outcome.state.config).toEqual(swapped);
  });
});
