import { describe, expect, it } from 'vitest';
import {
  clampPosition,
  csPerMinute,
  csTargetForPosition,
  formatGold,
  kdaRatio,
  readTilt,
} from '../overlay/hudMetrics';

describe('hud metrics', () => {
  it('sets a CS goal per role and none for support', () => {
    expect(csTargetForPosition('MIDDLE')).toBe(8);
    expect(csTargetForPosition('JUNGLE')).toBe(6);
    expect(csTargetForPosition('UTILITY')).toBeNull();
    expect(csTargetForPosition(null)).toBe(7.5);
  });

  it('waits a minute before reporting CS per minute', () => {
    expect(csPerMinute(10, 45)).toBe(0);
    expect(csPerMinute(80, 600)).toBe(8);
  });

  it('computes KDA without dividing by zero', () => {
    expect(kdaRatio(3, 0, 4)).toBe(7);
    expect(kdaRatio(2, 2, 2)).toBe(2);
  });

  it('only counts deaths inside the last three minutes', () => {
    expect(readTilt([100, 500, 560], 600, 2)).toMatchObject({ active: true, recentDeaths: 2 });
    expect(readTilt([100, 200], 600, 2)).toMatchObject({ active: false, label: 'Estable' });
  });

  it('keeps the panel inside the game window', () => {
    const viewport = { width: 1000, height: 500 };
    const panel = { width: 200, height: 100 };
    expect(clampPosition({ x: 2, y: -1 }, panel, viewport)).toEqual({ x: 0.8, y: 0 });
    expect(clampPosition({ x: Number.NaN, y: 0.5 }, panel, viewport)).toEqual({ x: 0, y: 0.5 });
  });

  it('shortens gold above a thousand', () => {
    expect(formatGold(950)).toBe('950');
    expect(formatGold(12340)).toBe('12.3k');
  });
});
