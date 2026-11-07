// ============================================================
// LolAnalyzer - Post-match analysis
// src/services/analysisClient.ts
//
// The backend writes one analysis per game from the final summary and
// stores it, so asking again never spends AI tokens twice.
// ============================================================

import { BackendError, apiRequest } from './backendAuth';

export interface AnalysisMetric {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  higher_is_better: boolean;
  verdict: 'good' | 'ok' | 'bad';
}

export interface MatchAnalysis {
  matchId: string;
  championName: string;
  role: string;
  win: boolean;
  metrics: AnalysisMetric[];
  strengths: string;
  improvements: string;
  focus: string;
  source: 'groq' | 'rules';
  createdAt: string | null;
}

/** Stored analysis for a game, or null when it has none yet. */
export async function fetchAnalysis(matchId: string): Promise<MatchAnalysis | null> {
  try {
    return await apiRequest<MatchAnalysis>(`/api/analysis/${encodeURIComponent(matchId)}`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}

/** Analyses an older game on demand; returns the stored one if it already exists. */
export function createAnalysis(matchId: string): Promise<MatchAnalysis> {
  return apiRequest<MatchAnalysis>(`/api/analysis/${encodeURIComponent(matchId)}`, { method: 'POST' });
}

/** After a game: syncs the client's history and analyses the newest finished game once. */
export async function analyzeLatest(): Promise<MatchAnalysis | null> {
  const body = await apiRequest<{ analysis: MatchAnalysis | null }>('/api/analysis/latest', { method: 'POST' });
  return body.analysis;
}

/** True when the analysis was written after the game ended, so it is about that game. */
export function isFreshAnalysis(analysis: MatchAnalysis | null, gameEndedAt: number, slackMs = 60_000): boolean {
  if (!analysis?.createdAt) return false;
  const created = Date.parse(analysis.createdAt);
  return Number.isFinite(created) && created >= gameEndedAt - slackMs;
}
