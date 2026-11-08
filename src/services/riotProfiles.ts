// ============================================================
// LolAnalyzer - League profiles of the analyzer account
// src/services/riotProfiles.ts
//
// A LolAnalyzer account is not tied to one League account. Every League
// account opened in the client is stored as a profile, and the dashboard
// shows one of them (or all of them together).
// ============================================================

import { apiRequest, type RiotProfilePayload, type RiotStatsPayload } from './backendAuth';

/** Selector value that shows the games of every profile together. */
export const ALL_PROFILES = 'all';

export interface StoredRiotProfile {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  profileIconId: number | null;
  summonerLevel: number | null;
  rankedSolo: RiotProfilePayload['rankedSolo'];
  lastSeenAt: string | null;
  linked: boolean;
}

export interface ProfilesPayload {
  profiles: StoredRiotProfile[];
  /** Linked Riot ID, else the last profile opened in the client. */
  default: string | null;
  linked: string | null;
}

export interface ProfileChoiceInput {
  /** What the player picked in the selector; null means automatic. */
  choice: string | null;
  linked: string | null;
  /** League account open in the client right now. */
  clientPuuid: string | null;
  /** Server default: last profile seen when nothing else applies. */
  fallback: string | null;
  known: string[];
}

/**
 * Profile the dashboard shows. A manual choice wins while it still exists.
 * Otherwise the linked Riot ID stays fixed, and without a link the dashboard
 * follows the account open in the client, then the last one opened.
 */
export function chooseActiveProfile({ choice, linked, clientPuuid, fallback, known }: ProfileChoiceInput): string {
  if (choice === ALL_PROFILES) return ALL_PROFILES;
  if (choice && known.includes(choice)) return choice;
  return linked ?? clientPuuid ?? fallback ?? ALL_PROFILES;
}

/** Name shown for a profile in the selector and the header. */
export function profileLabel(profile: Pick<StoredRiotProfile, 'gameName' | 'tagLine' | 'puuid'>): string {
  if (!profile.gameName) return `Perfil ${profile.puuid.slice(0, 6)}`;
  return profile.tagLine ? `${profile.gameName}#${profile.tagLine}` : profile.gameName;
}

export function fetchProfiles(): Promise<ProfilesPayload> {
  return apiRequest<ProfilesPayload>('/api/riot/profiles');
}

/** Games and totals of one profile, or of every profile with ALL_PROFILES. */
export async function fetchProfileHistory(profile: string): Promise<{ matches: unknown[]; stats: RiotStatsPayload }> {
  const query = `profile=${encodeURIComponent(profile)}`;
  const [matches, stats] = await Promise.all([
    apiRequest<unknown[]>(`/api/riot/matches?count=10&${query}`),
    apiRequest<RiotStatsPayload>(`/api/riot/stats?${query}`),
  ]);
  return { matches, stats };
}
