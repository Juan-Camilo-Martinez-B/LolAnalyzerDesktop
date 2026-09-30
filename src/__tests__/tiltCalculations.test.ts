import { describe, expect, it } from 'vitest';
import { deathsBeforeTiltAlert, patchSettings } from '../services/settingsStore';
import {
  backgroundTiltIndex,
  clampTilt,
  csPerMinute,
  simulatorTiltIndex,
  tiltBand,
  tiltBandLabel,
  tiltLevelForSensitivity,
} from '../services/tiltCalculations';

describe('tilt calculations', () => {
  it('maps coach sensitivity to a death threshold', () => {
    expect(deathsBeforeTiltAlert('high')).toBe(1);
    expect(deathsBeforeTiltAlert('balanced')).toBe(2);
    expect(deathsBeforeTiltAlert('low')).toBe(3);
  });

  it('assigns the background tilt index and level from sensitivity', () => {
    expect(backgroundTiltIndex('high')).toBe(55);
    expect(tiltLevelForSensitivity('high')).toBe('medium');
    expect(backgroundTiltIndex('balanced')).toBe(75);
    expect(tiltLevelForSensitivity('balanced')).toBe('high');
    expect(backgroundTiltIndex('low')).toBe(88);
    expect(tiltLevelForSensitivity('low')).toBe('critical');
  });

  it('grows the simulator index with deaths and caps it at 100', () => {
    expect(simulatorTiltIndex(1)).toBe(52);
    expect(simulatorTiltIndex(2)).toBe(68);
    expect(simulatorTiltIndex(10)).toBe(100);
    expect(simulatorTiltIndex(Number.NaN)).toBe(36);
  });

  it('splits the gauge into four bands, including the edges', () => {
    expect(tiltBand(0)).toBe('zen');
    expect(tiltBand(25)).toBe('zen');
    expect(tiltBand(25.1)).toBe('focused');
    expect(tiltBand(50)).toBe('focused');
    expect(tiltBand(50.1)).toBe('frustrated');
    expect(tiltBand(75)).toBe('frustrated');
    expect(tiltBand(75.1)).toBe('critical');
    expect(tiltBandLabel('critical')).toBe('TILT CRÍTICO');
  });

  it('clamps indexes that fall outside 0–100', () => {
    expect(clampTilt(-8)).toBe(0);
    expect(clampTilt(140)).toBe(100);
    expect(clampTilt(Number.NaN)).toBe(0);
    expect(tiltBand(140)).toBe('critical');
    expect(tiltBand(Number.NaN)).toBe('zen');
  });

  it('computes CS per minute without dividing by zero', () => {
    expect(csPerMinute(120, 600)).toBe(12);
    expect(csPerMinute(10, 0)).toBe(600);
    expect(csPerMinute(Number.NaN, 60)).toBe(0);
  });

  it('clamps overlay opacity when settings are patched', () => {
    const next = patchSettings({ overlayOpacity: 0.1, coachSensitivity: 'low' });
    expect(next.overlayOpacity).toBe(0.35);
    expect(next.coachSensitivity).toBe('low');

    const restored = patchSettings({ overlayOpacity: 0.92, coachSensitivity: 'balanced' });
    expect(restored.overlayOpacity).toBe(0.92);
    expect(restored.coachSensitivity).toBe('balanced');
  });
});
