// ============================================================
// LolAnalyzer - Pure tilt, pacing and sensitivity helpers
// src/services/tiltCalculations.ts
// ============================================================

import type { CoachSensitivity } from './settingsStore';

export type TiltBand = 'zen' | 'focused' | 'frustrated' | 'critical';

const BAND_LABEL: Record<TiltBand, string> = {
  zen: 'Zen Master',
  focused: 'Calmo & Enfocado',
  frustrated: 'Frustración Leve',
  critical: 'TILT CRÍTICO',
};

/** Keeps a tilt index inside the gauge range. Non-numeric input becomes 0. */
export function clampTilt(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(100, Math.max(0, index));
}

/** Same bands as the desktop Tilt-o-Meter: 0–25, 26–50, 51–75, 76–100. */
export function tiltBand(index: number): TiltBand {
  const value = clampTilt(index);
  if (value <= 25) return 'zen';
  if (value <= 50) return 'focused';
  if (value <= 75) return 'frustrated';
  return 'critical';
}

export function tiltBandLabel(band: TiltBand): string {
  return BAND_LABEL[band];
}

/** Index the background assigns once the death threshold is reached. */
export function backgroundTiltIndex(sensitivity: CoachSensitivity): number {
  if (sensitivity === 'low') return 88;
  if (sensitivity === 'high') return 55;
  return 75;
}

export function tiltLevelForSensitivity(sensitivity: CoachSensitivity): 'medium' | 'high' | 'critical' {
  if (sensitivity === 'low') return 'critical';
  if (sensitivity === 'high') return 'medium';
  return 'high';
}

/** Index used by the browser simulator, growing with each death and capped at 100. */
export function simulatorTiltIndex(deaths: number): number {
  const count = Number.isFinite(deaths) ? Math.max(0, deaths) : 0;
  return Math.min(100, 36 + count * 16);
}

/** CS per minute. A zero clock still uses one second so the rate stays finite. */
export function csPerMinute(cs: number, gameTimeSec: number): number {
  const safeCs = Number.isFinite(cs) ? Math.max(0, cs) : 0;
  const minutes = Math.max((Number.isFinite(gameTimeSec) ? gameTimeSec : 0) / 60, 1 / 60);
  return safeCs / minutes;
}
