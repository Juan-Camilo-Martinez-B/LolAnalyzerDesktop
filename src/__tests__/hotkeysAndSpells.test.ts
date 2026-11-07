import { describe, expect, it } from 'vitest';
import { captureShortcut, formatShortcut } from '../services/hotkeyFormat';
import { orderSpells } from '../services/spellOrder';

const press = (code: string, mods: Partial<{ ctrl: boolean; alt: boolean; shift: boolean }> = {}) => ({
  key: '', code, ctrlKey: Boolean(mods.ctrl), altKey: Boolean(mods.alt), shiftKey: Boolean(mods.shift), metaKey: false,
});

describe('shortcut capture', () => {
  it('builds an accelerator from the physical key', () => {
    expect(captureShortcut(press('KeyO', { ctrl: true, shift: true }))).toEqual({ kind: 'done', accelerator: 'CommandOrControl+Shift+O' });
    expect(captureShortcut(press('F9', { alt: true }))).toEqual({ kind: 'done', accelerator: 'Alt+F9' });
  });

  it('waits on modifiers, cancels on Escape and rejects keys without Ctrl or Alt', () => {
    expect(captureShortcut(press('ShiftLeft', { shift: true }))).toEqual({ kind: 'pending' });
    expect(captureShortcut(press('Escape'))).toEqual({ kind: 'cancel' });
    expect(captureShortcut(press('KeyP', { shift: true })).kind).toBe('invalid');
    expect(captureShortcut(press('Space', { ctrl: true })).kind).toBe('invalid');
  });

  it('shows Ctrl instead of the Electron name', () => {
    expect(formatShortcut('CommandOrControl+Shift+L')).toBe('Ctrl+Shift+L');
  });
});

describe('spell order', () => {
  it('puts Flash on the chosen key', () => {
    expect(orderSpells([4, 14], 'F')).toEqual([14, 4]);
    expect(orderSpells([14, 4], 'D')).toEqual([4, 14]);
    expect(orderSpells([4, 12], 'D')).toEqual([4, 12]);
  });

  it('keeps builds without Flash and rejects incomplete ones', () => {
    expect(orderSpells([11, 6], 'F')).toEqual([11, 6]);
    expect(orderSpells([4], 'D')).toBeNull();
    expect(orderSpells([4, 4], 'D')).toBeNull();
  });
});
