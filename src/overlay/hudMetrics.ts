// ============================================================
// LolAnalyzer - Pure helpers for the in-game HUD
// src/overlay/hudMetrics.ts
// ============================================================

/** Live Client positions. Support has no CS goal. */
const CS_TARGET_BY_POSITION: Record<string, number> = {
  TOP: 7.5,
  JUNGLE: 6.0,
  MIDDLE: 8.0,
  BOTTOM: 8.5,
};

/** Recent deaths that count toward tilt, in game seconds. */
export const TILT_WINDOW_SECONDS = 180;

export function csTargetForPosition(position: string | null | undefined): number | null {
  if (!position) return 7.5;
  if (position === 'UTILITY' || position === 'SUPPORT') return null;
  return CS_TARGET_BY_POSITION[position] ?? 7.5;
}

export function csPerMinute(creepScore: number, gameTimeSec: number): number {
  if (gameTimeSec < 60) return 0;
  return creepScore / (gameTimeSec / 60);
}

export function kdaRatio(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(1, deaths);
}

export function positionLabel(position: string | null | undefined): string {
  switch (position) {
    case 'TOP': return 'Top';
    case 'JUNGLE': return 'Jungla';
    case 'MIDDLE': return 'Mid';
    case 'BOTTOM': return 'ADC';
    case 'UTILITY': return 'Soporte';
    default: return '';
  }
}

export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatGold(gold: number): string {
  if (gold >= 1000) return `${(gold / 1000).toFixed(1)}k`;
  return `${Math.floor(gold)}`;
}

export interface TiltReading {
  active: boolean;
  recentDeaths: number;
  label: string;
}

/** Tilt is raised when enough deaths happen inside the recent window. */
export function readTilt(deathTimes: number[], gameTimeSec: number, threshold: number): TiltReading {
  const since = gameTimeSec - TILT_WINDOW_SECONDS;
  const recentDeaths = deathTimes.filter((time) => time >= since && time <= gameTimeSec).length;
  const active = recentDeaths >= Math.max(1, threshold);
  const label = active
    ? `${recentDeaths} ${recentDeaths === 1 ? 'muerte' : 'muertes'} en 3 min`
    : 'Estable';
  return { active, recentDeaths, label };
}

export interface PanelPosition {
  /** Left edge as a fraction of the overlay width (0..1). */
  x: number;
  /** Top edge as a fraction of the overlay height (0..1). */
  y: number;
}

/** Keeps the whole panel inside the game window. */
export function clampPosition(
  position: PanelPosition,
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
): PanelPosition {
  const maxX = Math.max(0, viewport.width - panel.width) / Math.max(1, viewport.width);
  const maxY = Math.max(0, viewport.height - panel.height) / Math.max(1, viewport.height);
  const clamp = (value: number, max: number) => (Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0);
  return { x: clamp(position.x, maxX), y: clamp(position.y, maxY) };
}
