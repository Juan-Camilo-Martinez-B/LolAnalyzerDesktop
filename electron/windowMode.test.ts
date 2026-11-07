import { describe, expect, it } from 'vitest';
import { decideOverlayVisibility } from './overlayVisibility.ts';
import { parseWindowMode } from './windowMode.ts';

describe('parseWindowMode', () => {
  it('reads WindowMode inside the General section', () => {
    const text = `
[Game]
WindowMode=0
[General]
Width=1920
WindowMode=2
[HUD]
WindowMode=1
`;
    expect(parseWindowMode(text)).toBe(2);
  });

  it('accepts windowed and exclusive values', () => {
    expect(parseWindowMode('[General]\nWindowMode=1\n')).toBe(1);
    expect(parseWindowMode('[General]\nWindowMode=0\n')).toBe(0);
  });

  it('ignores comments and missing keys', () => {
    expect(parseWindowMode('; WindowMode=2\n[General]\n# WindowMode=1\n')).toBeNull();
    expect(parseWindowMode('WindowMode=2\n')).toBeNull();
  });
});

describe('decideOverlayVisibility', () => {
  const base = {
    phaseWants: true,
    userSuppressed: false,
    windowFound: true,
    minimized: false,
    windowMode: 2 as number | null,
    configFound: true,
  };

  it('shows for borderless and windowed modes', () => {
    expect(decideOverlayVisibility({ ...base, windowMode: 2 }).show).toBe(true);
    expect(decideOverlayVisibility({ ...base, windowMode: 1 }).show).toBe(true);
  });

  it('hides exclusive fullscreen and reports the block', () => {
    const decision = decideOverlayVisibility({ ...base, windowMode: 0 });
    expect(decision.show).toBe(false);
    expect(decision.blockedByExclusiveFullscreen).toBe(true);
  });

  it('shows when the cfg is missing and the game window exists', () => {
    const decision = decideOverlayVisibility({
      ...base,
      windowMode: null,
      configFound: false,
    });
    expect(decision.show).toBe(true);
    expect(decision.blockedByExclusiveFullscreen).toBe(false);
  });

  it('hides when the game is minimized, closed, or the user dismissed it', () => {
    expect(decideOverlayVisibility({ ...base, minimized: true }).show).toBe(false);
    expect(decideOverlayVisibility({ ...base, windowFound: false }).show).toBe(false);
    expect(decideOverlayVisibility({ ...base, userSuppressed: true }).show).toBe(false);
    expect(decideOverlayVisibility({ ...base, phaseWants: false }).show).toBe(false);
  });
});
