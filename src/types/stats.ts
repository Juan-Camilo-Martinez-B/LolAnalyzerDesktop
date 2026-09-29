// ============================================================
// LolAnalyzer - Stats & Analytics Type Contracts
// src/types/stats.ts
// ============================================================

import type { Role } from './game';

/** ── Key Performance Indicators (KPI) summary ── */
export interface KpiSummary {
  winrate: number;          // 0-100 %
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;              // (K+A)/D
  avgCSPerMin: number;
  avgGoldDiffAt15: number;  // positive = ahead
  tiltIndex: number;        // 0-100 (0=zen, 100=full tilt)
  gamesAnalyzed: number;
  lastUpdated: string;      // ISO timestamp
}

/** ── Per-champion performance row ── */
export interface ChampionPerformance {
  championId: number;
  championName: string;
  role: Role;
  games: number;
  wins: number;
  winrate: number;          // 0-100
  kda: number;
  avgCSPerMin: number;
  mastery: number;          // mastery points
  masteryLevel: number;     // 1-7
  recentTrend: 'up' | 'down' | 'stable'; // last 5 games direction
}

/** ── Minute-by-minute telemetry snapshot ── */
export interface TelemetrySnapshot {
  minute: number;
  cs: number;
  gold: number;
  deaths: number;
  coachInterventions: number;
  playerComplied: boolean | null; // null if no intervention
  // comparisons vs baseline
  csVsChallenger: number;         // delta
  goldVsChallenger: number;
}

/** ── Full match telemetry (for the drilldown modal) ── */
export interface MatchTelemetry {
  matchId: string;
  totalDuration: number;        // minutes
  snapshots: TelemetrySnapshot[];
  peakTiltMinute?: number;
  coachComplianceRate: number;  // 0-100 %
}

/** ── Tilt risk factors used in gauge calculation ── */
export interface TiltFactors {
  deathStreaks: number;       // consecutive deaths
  lowCSPhases: number;        // minutes below 4.0 cs/min
  recentLoseStreak: number;   // consecutive losses
  rageQuit?: boolean;
  averageEmotionalScore: number; // 0-100 (from analysis)
}

/** ── Aggregated role distribution for radar chart ── */
export interface RoleDistribution {
  role: Role;
  gamesPlayed: number;
  winrate: number;
  averageKDA: number;
}

/** ── Objective timer record ── */
export interface ObjectiveTimer {
  type: 'dragon' | 'baron' | 'herald' | 'void_grub';
  spawnTimeSeconds: number;     // game time when it spawns/respawns
  isAlive: boolean;
  label: string;                // e.g. "Infernal Dragon"
  elementalType?: 'infernal' | 'mountain' | 'ocean' | 'cloud' | 'hextech' | 'chemtech' | 'elder';
}
