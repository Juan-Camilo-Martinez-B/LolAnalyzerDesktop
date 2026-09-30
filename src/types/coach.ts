// ============================================================
// LolAnalyzer - AI Coach Type Contracts
// src/types/coach.ts
// ============================================================

/** Severity levels for coach messages */
export type CoachSeverity = 'info' | 'warning' | 'critical' | 'positive';

/** Category of coaching advice */
export type CoachCategory =
  | 'cs_pacing'
  | 'tilt_alert'
  | 'objective_control'
  | 'vision_control'
  | 'trade_timing'
  | 'wave_management'
  | 'tactical_positioning'
  | 'mental_resilience'
  | 'general';

/** ── Single AI coaching message ── */
export interface CoachMessage {
  id: string;
  timestamp: number;    // game time in seconds (or epoch ms for history)
  message: string;
  severity: CoachSeverity;
  category: CoachCategory;
  // Compliance tracking
  playerComplied?: boolean;
  complianceTimestamp?: number;
  // Outcome
  outcomePositive?: boolean;  // did following the advice lead to good outcome?
}

/** ── Coaching session (one per match) ── */
export interface CoachSession {
  matchId: string;
  messages: CoachMessage[];
  totalMessages: number;
  complianceRate: number;   // 0-100 %
  winWithCompliance?: boolean;
}

/** ── Aggregated AI Coach analytics ── */
export interface CoachAnalytics {
  totalAdvicesGiven: number;
  overallComplianceRate: number;
  winrateWhenFollowed: number;
  winrateWhenIgnored: number;
  mostFrequentCategory: CoachCategory;
  categoryBreakdown: { category: CoachCategory; count: number; complianceRate: number }[];
  recentSessions: CoachSession[];
  // Convenience fields for UI tabs
  complianceRate?: number;
  totalInterventions?: number;
  frequentMistakes?: string[];
}

/** ── Champ select recommendation entry ── */
export interface ChampionRecommendation {
  championId: number;
  championName: string;
  role: string;
  reason: string;
  score?: number;       // 0-100 recommendation score
  countersPicks?: number[];   // champion IDs this counters
  synergyWith?: number[];     // champion IDs it synergizes with
  runesRecommended?: {
    primaryPath: number;
    keystoneId: number;
    primarySlots: number[];
    secondaryPath: number;
    secondarySlots: number[];
  };
  summonerSpells?: [number, number];
  winrateVsEnemy?: number;
  synergyScore?: number;
  tags?: string[];
}

/** ── Tilt alert payload broadcasted to overlay ── */
export interface TiltAlert {
  level: 'low' | 'medium' | 'high' | 'critical';
  tiltIndex: number;      // 0-100
  triggerReason: string;  // human-readable reason
  coachMessage: string;   // short in-game advice
  breathingExercise?: boolean;
  timestamp: number;
}

/** ── Real-time overlay state ── */
export interface OverlayState {
  visible: boolean;
  mode: 'compact' | 'expanded' | 'hidden';
  /** 0.35–1. HUD opacity so the overlay stays readable without covering the game. */
  opacity: number;
  tiltAlert: TiltAlert | null;
  activeCoachMessage: CoachMessage | null;
  csPerMin: number;
  csVsChallenger: number; // delta
  gameTime: number;       // seconds
  objectiveTimers: import('./stats').ObjectiveTimer[];
}
