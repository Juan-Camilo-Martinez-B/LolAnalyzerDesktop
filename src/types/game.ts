// ============================================================
// LolAnalyzer - Game & LCU Type Contracts
// src/types/game.ts
// ============================================================

/** Roles / positions */
export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | 'FILL' | 'UNKNOWN';

/** Regions supported by the Riot API */
export type Region = 'na1' | 'euw1' | 'eun1' | 'kr' | 'br1' | 'la1' | 'la2' | 'oc1' | 'ru' | 'tr1' | 'jp1';

/** Game phases broadcasted by the background window */
export type GamePhase =
  | 'LOBBY'
  | 'MATCHMAKING'
  | 'CHAMP_SELECT'
  | 'IN_GAME'
  | 'END_OF_GAME'
  | 'NONE';

/** Application connection status */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

/** LoL rank tier */
export type Tier =
  | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD'
  | 'PLATINUM' | 'EMERALD' | 'DIAMOND'
  | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'
  | 'UNRANKED';

export type Division = 'I' | 'II' | 'III' | 'IV';

/** ── LCU / Summoner profile ── */
export interface SummonerProfile {
  puuid: string;
  summonerId: number;
  accountId: string;
  displayName: string;
  gameName?: string;
  tagLine?: string;
  summonerLevel: number;
  profileIconId: number;
  region: Region;
}

/** ── Ranked stats ── */
export interface RankedInfo {
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
  tier: Tier;
  division: Division;
  leaguePoints: number;
  wins: number;
  losses: number;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  };
}

/** ── A single participant in a match ── */
export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
  role: Role;
  teamId: 100 | 200;
  kills: number;
  deaths: number;
  assists: number;
  totalCS: number;
  goldEarned: number;
  items: number[];   // item IDs
  primaryRuneId?: number;
  summoner1Id: number;
  summoner2Id: number;
  win: boolean;
  // extended telemetry fields
  visionScore?: number;
  damageDealtToChampions?: number;
  damageTaken?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  turretKills?: number;
}

/** ── Full match record ── */
export interface MatchRecord {
  matchId: string;
  gameCreation: number;       // epoch ms
  gameDuration: number;       // seconds
  gameMode: string;
  queueId: number;
  participants: MatchParticipant[];
  // Resolved for the local player
  localParticipant?: MatchParticipant;
  win?: boolean;
}

/** ── Live game state (broadcasted from background) ── */
export interface LiveGameEvent {
  type: 'kill' | 'death' | 'assist' | 'objective' | 'cs_update' | 'gold_update' | 'game_start' | 'game_end';
  timestamp: number;  // game time in seconds
  value?: number;
  meta?: Record<string, unknown>;
}

/** ── Champion selection phase pick/ban ── */
export interface ChampSelectAction {
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  type: 'pick' | 'ban';
}

export interface ChampSelectSession {
  actions: ChampSelectAction[][];
  localPlayerCellId: number;
  myTeam: ChampSelectPlayer[];
  theirTeam: ChampSelectPlayer[];
  bans: {
    myTeamBans: number[];
    theirTeamBans: number[];
  };
  timer: {
    phase: string;
    adjustedTimeLeftInPhase: number;
  };
}

export interface ChampSelectPlayer {
  cellId: number;
  championId: number;
  assignedPosition: string;
  summonerId: number;
  puuid: string;
}
