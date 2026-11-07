import { clearAuthToken, setAuthToken } from './apiClient';
import { clearRefreshToken, readRefreshToken, saveRefreshToken } from './secureSession';
import { isThemePreference, type ThemePreference } from './theme';
import { toUserMessage } from './userErrors';
import { CLOUD_API_URL, agentHeaders, getAgentEndpoint } from './endpoints';

const BASE_URL = CLOUD_API_URL;

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'BackendError';
  }
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  region: string;
  riotLinked: boolean;
  riotGameName: string | null;
  riotTagLine: string | null;
  summonerIconId: number | null;
  themePreference: 'light' | 'system' | 'dark';
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in_seconds: number;
}

export interface ChampionOption {
  id: string;
  name: string;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, retryAuth = true): Promise<T> {
  return send<T>(BASE_URL, path, options, retryAuth, new Headers(options.headers));
}

/**
 * Local agent request (champion select, imports, live coach). Carries the
 * agent's launch token and the player's JWT, which the agent forwards to the cloud.
 */
export async function agentRequest<T>(path: string, options: RequestInit = {}, retryAuth = true): Promise<T> {
  const endpoint = await getAgentEndpoint();
  return send<T>(endpoint.url, path, options, retryAuth, agentHeaders(endpoint, new Headers(options.headers)));
}

async function send<T>(base: string, path: string, options: RequestInit, retryAuth: boolean, headers: Headers): Promise<T> {
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  const token = accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new BackendError(0, toUserMessage(0, null, timedOut ? 'timeout' : 'network'));
  }

  if (response.status === 401 && retryAuth && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
    const refreshed = await refreshSession();
    if (refreshed) return send<T>(base, path, options, false, headers);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: unknown };
    throw new BackendError(response.status, toUserMessage(response.status, body.detail));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let accessToken: string | null = null;

function remember(tokens: TokenPair): void {
  accessToken = tokens.access_token;
  setAuthToken(tokens.access_token);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const tokens = await apiRequest<TokenPair>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
  remember(tokens);
  await saveRefreshToken(tokens.refresh_token);
  return currentUser();
}

export async function registerAccount(payload: {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
  favoriteChampion: string;
  peakElo: string;
  firstMain: string;
  region: string;
}): Promise<AuthUser> {
  const tokens = await apiRequest<TokenPair>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      username: payload.username,
      password: payload.password,
      password_confirm: payload.passwordConfirm,
      favorite_champion: payload.favoriteChampion,
      peak_elo: payload.peakElo,
      first_main: payload.firstMain,
      region: payload.region,
    }),
  }, false);
  remember(tokens);
  await saveRefreshToken(tokens.refresh_token);
  return currentUser();
}

export async function currentUser(): Promise<AuthUser> {
  const user = await apiRequest<{
    id: number;
    email: string;
    username: string;
    region: string;
    riot_linked: boolean;
    riot_game_name: string | null;
    riot_tag_line: string | null;
    summoner_icon_id?: number | null;
    theme_preference?: string;
  }>('/api/auth/me');
  const theme = isThemePreference(user.theme_preference) ? user.theme_preference : 'light';
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    region: user.region,
    riotLinked: user.riot_linked,
    riotGameName: user.riot_game_name,
    riotTagLine: user.riot_tag_line,
    summonerIconId: user.summoner_icon_id ?? null,
    themePreference: theme,
  };
}

export async function refreshSession(): Promise<boolean> {
  const refresh = await readRefreshToken();
  if (!refresh) return false;
  try {
    const tokens = await apiRequest<TokenPair>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refresh }),
    }, false);
    remember(tokens);
    await saveRefreshToken(tokens.refresh_token);
    return true;
  } catch {
    await logout();
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    if (accessToken) await apiRequest('/api/auth/logout', { method: 'POST' }, false);
  } catch {
    // Local session still has to disappear if the server is down.
  }
  accessToken = null;
  clearAuthToken();
  clearRefreshToken();
}

export async function restoreSession(): Promise<AuthUser | null> {
  const ok = await refreshSession();
  if (!ok) return null;
  try {
    return await currentUser();
  } catch {
    await logout();
    return null;
  }
}

export async function recoveryOptions(): Promise<{ elos: string[]; champions: ChampionOption[] }> {
  return apiRequest('/api/auth/recovery-options', {}, false);
}

export async function resetPassword(payload: {
  email: string;
  favoriteChampion: string;
  peakElo: string;
  firstMain: string;
  newPassword: string;
  newPasswordConfirm: string;
}): Promise<void> {
  await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      favorite_champion: payload.favoriteChampion,
      peak_elo: payload.peakElo,
      first_main: payload.firstMain,
      new_password: payload.newPassword,
      new_password_confirm: payload.newPasswordConfirm,
    }),
  }, false);
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  await apiRequest('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ theme_preference: theme }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest('/api/profile/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function connectRiot(gameName: string, tagLine: string, region: string): Promise<void> {
  await apiRequest('/api/riot/connect', {
    method: 'POST',
    body: JSON.stringify({ game_name: gameName, tag_line: tagLine, region }),
  });
}

export interface RiotProfilePayload {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  region: string;
  summonerLevel: number | null;
  profileIconId: number | null;
  rankedSolo: {
    tier?: string;
    rank?: string;
    leaguePoints?: number;
    wins?: number;
    losses?: number;
  } | null;
}

export interface RiotStatsPayload {
  winrate: number;
  kda: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCSPerMin: number;
  gamesAnalyzed: number;
  tiltIndex: number;
  lastUpdated: string;
  champions: unknown[];
}

export async function fetchRiotBundle(): Promise<{
  profile: RiotProfilePayload;
  matches: unknown[];
  stats: RiotStatsPayload;
}> {
  // The cloud cannot read the League client: the agent copies recent games first.
  await syncClientHistory();
  const [profile, matches, stats] = await Promise.all([
    clientProfileOrCloud(),
    apiRequest<unknown[]>('/api/riot/matches?count=10'),
    apiRequest<RiotStatsPayload>('/api/riot/stats'),
  ]);
  return { profile, matches, stats };
}

/** Copies the client's recent games to the account. Silent when the client is closed. */
export async function syncClientHistory(): Promise<void> {
  try {
    await agentRequest('/api/local/history/sync', { method: 'POST' });
  } catch {
    // Client closed, agent not ready or another account open: the stored history still loads.
  }
}

/** Level and rank straight from the open client; the cloud (Riot API) when it is closed. */
async function clientProfileOrCloud(): Promise<RiotProfilePayload> {
  try {
    const local = await agentRequest<RiotProfilePayload>('/api/local/profile');
    const cloud = await apiRequest<RiotProfilePayload>('/api/riot/profile').catch(() => null);
    // Same linked account: keep the client's fresh level and rank.
    if (!cloud || cloud.puuid === local.puuid) return { ...cloud, ...local } as RiotProfilePayload;
    return cloud;
  } catch {
    return apiRequest<RiotProfilePayload>('/api/riot/profile');
  }
}
