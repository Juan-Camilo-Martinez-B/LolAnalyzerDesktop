// ============================================================
// LolAnalyzer - Saved reports
// src/services/reportsClient.ts
//
// Post-match analyses and lane plans stay on the account, so the player can
// read them again from the Coach view after the game or champion select.
// ============================================================

import { apiRequest } from './backendAuth';
import type { MatchAnalysis } from './analysisClient';

export interface MatchupReport {
  id: number;
  champion: string;
  opponent: string;
  lane: string;
  plan: { lane: string; fight: string; avoid: string };
  source: string;
  updatedAt: string | null;
}

export function fetchAnalysisReports(): Promise<MatchAnalysis[]> {
  return apiRequest<MatchAnalysis[]>('/api/analysis');
}

export function fetchMatchupReports(): Promise<MatchupReport[]> {
  return apiRequest<MatchupReport[]>('/api/ai/matchup-plans');
}

const LANE_LABELS: Record<string, string> = {
  top: 'Top',
  jungle: 'Jungla',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Soporte',
};

export function laneLabel(lane: string): string {
  return LANE_LABELS[lane.toLowerCase()] ?? lane.toUpperCase();
}

/** Short local date for report lists ("8 nov, 14:05"). */
export function reportDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
