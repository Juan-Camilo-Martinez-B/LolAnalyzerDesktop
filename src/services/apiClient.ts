// ============================================================
// LolAnalyzer - Backend API Client
// src/services/apiClient.ts
//
// HTTP client for the FastAPI LolAnalyzer backend.
// Handles auth tokens, retries, and typed responses.
// ============================================================

import type { KpiSummary, ChampionPerformance, MatchTelemetry } from '../types/stats';
import type { CoachAnalytics, CoachSession, ChampionRecommendation } from '../types/coach';
import type { MatchRecord, SummonerProfile } from '../types/game';

/* ─────────────────────────────────────────────────────────
   Configuration
───────────────────────────────────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1   = `${BASE_URL}/api/v1`;

let _authToken: string | null = null;

export function setAuthToken(token: string): void {
  _authToken = token;
}

export function clearAuthToken(): void {
  _authToken = null;
}

/* ─────────────────────────────────────────────────────────
   Core fetch wrapper
───────────────────────────────────────────────────────── */
interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

class ApiClientError extends Error {
  status: number;
  detail: unknown;
  constructor(err: ApiError) {
    super(err.message);
    this.name  = 'ApiClientError';
    this.status = err.status;
    this.detail = err.detail;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_V1}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: unknown };
        throw new ApiClientError({
          status:  res.status,
          message: `API error ${res.status} on ${path}`,
          detail:  body.detail,
        });
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (err instanceof ApiClientError && err.status < 500) break; // don't retry 4xx
      if (attempt < retries) await _delay(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function _delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ─────────────────────────────────────────────────────────
   Auth endpoints
───────────────────────────────────────────────────────── */
export async function loginWithLCU(puuid: string, summonerToken: string): Promise<{ access_token: string }> {
  const result = await apiFetch<{ access_token: string }>('/auth/lcu-login', {
    method: 'POST',
    body: JSON.stringify({ puuid, summoner_token: summonerToken }),
  });
  setAuthToken(result.access_token);
  return result;
}

export async function refreshToken(): Promise<{ access_token: string }> {
  const result = await apiFetch<{ access_token: string }>('/auth/refresh', { method: 'POST' });
  setAuthToken(result.access_token);
  return result;
}

/* ─────────────────────────────────────────────────────────
   Summoner & Profile
───────────────────────────────────────────────────────── */
export async function fetchSummonerProfile(puuid: string): Promise<SummonerProfile> {
  return apiFetch<SummonerProfile>(`/summoner/${puuid}`);
}

/* ─────────────────────────────────────────────────────────
   KPI & Stats
───────────────────────────────────────────────────────── */
export async function fetchKpiSummary(puuid: string, queueId = 420): Promise<KpiSummary> {
  return apiFetch<KpiSummary>(`/analytics/${puuid}/kpi?queue_id=${queueId}`);
}

export async function fetchChampionPerformance(puuid: string): Promise<ChampionPerformance[]> {
  return apiFetch<ChampionPerformance[]>(`/analytics/${puuid}/champions`);
}

export async function fetchMatchHistory(puuid: string, limit = 20): Promise<MatchRecord[]> {
  return apiFetch<MatchRecord[]>(`/matches/${puuid}?limit=${limit}`);
}

export async function fetchMatchTelemetry(matchId: string): Promise<MatchTelemetry> {
  return apiFetch<MatchTelemetry>(`/matches/${matchId}/telemetry`);
}

/* ─────────────────────────────────────────────────────────
   AI Coach
───────────────────────────────────────────────────────── */
export async function fetchCoachAnalytics(puuid: string): Promise<CoachAnalytics> {
  return apiFetch<CoachAnalytics>(`/coach/${puuid}/analytics`);
}

export async function fetchCoachSession(matchId: string): Promise<CoachSession> {
  return apiFetch<CoachSession>(`/coach/session/${matchId}`);
}

export async function submitCoachCompliance(
  messageId: string,
  complied: boolean
): Promise<void> {
  await apiFetch<void>(`/coach/compliance`, {
    method: 'POST',
    body: JSON.stringify({ message_id: messageId, complied }),
  });
}

/* ─────────────────────────────────────────────────────────
   Champ Select Recommendations
───────────────────────────────────────────────────────── */
export async function fetchChampionRecommendations(
  puuid: string,
  allyChampIds: number[],
  enemyChampIds: number[],
  role: string
): Promise<ChampionRecommendation[]> {
  return apiFetch<ChampionRecommendation[]>('/champ-select/recommend', {
    method: 'POST',
    body: JSON.stringify({
      puuid,
      ally_champ_ids: allyChampIds,
      enemy_champ_ids: enemyChampIds,
      role,
    }),
  });
}

/* ─────────────────────────────────────────────────────────
   Telemetry sync (send match data to backend after game end)
───────────────────────────────────────────────────────── */
export async function syncMatchTelemetry(telemetry: MatchTelemetry): Promise<void> {
  await apiFetch<void>('/telemetry/sync', {
    method: 'POST',
    body: JSON.stringify(telemetry),
  });
}

/* ─────────────────────────────────────────────────────────
   Health check
───────────────────────────────────────────────────────── */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>(`${BASE_URL}/health`);
    return true;
  } catch {
    return false;
  }
}
