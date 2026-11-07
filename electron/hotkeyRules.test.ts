import { describe, expect, it } from 'vitest';
import { DEFAULT_HOTKEYS, checkAccelerator, checkHotkeyConfig } from './hotkeyRules.ts';

describe('hotkey rules', () => {
  it('normalizes modifier names and order', () => {
    expect(checkAccelerator('shift+ctrl+o')).toEqual({ ok: true, accelerator: 'CommandOrControl+Shift+O' });
    expect(checkAccelerator('Alt+F9')).toEqual({ ok: true, accelerator: 'Alt+F9' });
  });

  it('requires Ctrl or Alt so the game and chat keep their keys', () => {
    expect(checkAccelerator('Shift+P').ok).toBe(false);
    expect(checkAccelerator('P').ok).toBe(false);
  });

  it('blocks League chords and odd keys', () => {
    expect(checkAccelerator('Ctrl+Q')).toMatchObject({ ok: false, error: expect.stringContaining('League') });
    expect(checkAccelerator('Ctrl+Space').ok).toBe(false);
    expect(checkAccelerator('Ctrl+Ctrl+K').ok).toBe(false);
  });

  it('accepts the defaults and rejects a shortcut used twice', () => {
    expect(checkHotkeyConfig(DEFAULT_HOTKEYS)).toEqual({ ok: true, config: DEFAULT_HOTKEYS });
    const repeated = { ...DEFAULT_HOTKEYS, cycleMode: 'Ctrl+Shift+O' };
    expect(checkHotkeyConfig(repeated)).toMatchObject({ ok: false, action: 'cycleMode' });
  });
});
