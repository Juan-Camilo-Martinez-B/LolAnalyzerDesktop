// ============================================================
// LolAnalyzer - Which sound a coach tip plays in the HUD
// src/overlay/adviceSound.ts
// ============================================================

import { audioService } from '../services/audioService';
import type { OverlayCoachAdvice } from '../services/overwolfService';

export type AdviceSound = 'praise' | 'objective' | 'danger' | 'tip';

const DANGER_CATEGORIES = new Set(['recall', 'death', 'tilt']);

/** Good plays get a fanfare, objectives chime, danger pulses, anything else is a soft tip. */
export function adviceSound(advice: Pick<OverlayCoachAdvice, 'severity' | 'category'>): AdviceSound {
  if (advice.category === 'praise') return 'praise';
  if (advice.category === 'objective') return 'objective';
  const severity = advice.severity.toUpperCase();
  if (severity === 'CRITICAL' || DANGER_CATEGORIES.has(advice.category ?? '')) return 'danger';
  if (severity === 'WARNING') return 'danger';
  return 'tip';
}

/** Plays the sound for a tip. Each sound honours its own switch in Settings. */
export function playAdviceSound(advice: OverlayCoachAdvice): void {
  const sound = adviceSound(advice);
  if (sound === 'praise') audioService.playPraise();
  else if (sound === 'objective') audioService.playHextechAlert();
  else if (sound === 'danger') audioService.playWarning();
  else audioService.playCoachTip();
}
