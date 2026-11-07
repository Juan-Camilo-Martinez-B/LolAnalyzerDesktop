// ============================================================
// LolAnalyzer - Where each request goes
// src/services/endpoints.ts
//
// Cloud API (Vercel): accounts, Riot API, history, analysis, AI.
// Local agent (bundled in the desktop app, 127.0.0.1): champion
// select, imports and the live coach, which read the League client.
// In development one full backend on :8000 answers both.
// ============================================================

/** Cloud API base. Set VITE_API_BASE_URL when building the release. */
export const CLOUD_API_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/** Agent base in development (the full backend); the packaged app asks Electron instead. */
const DEV_AGENT_URL: string = import.meta.env.VITE_LOCAL_AGENT_URL || CLOUD_API_URL;

export interface AgentEndpoint {
  url: string;
  /** Per-launch token Electron gave the agent. Null in development (full backend). */
  token: string | null;
}

interface AgentBridge {
  getAgentInfo?: () => Promise<{ url?: unknown; token?: unknown } | null>;
}

let agentRequest: Promise<AgentEndpoint> | null = null;

/** Resolves once: the packaged app's agent, or the development backend. */
export function getAgentEndpoint(): Promise<AgentEndpoint> {
  if (!agentRequest) {
    agentRequest = (async () => {
      const bridge = (typeof window !== 'undefined' ? window.lolAnalyzer : undefined) as AgentBridge | undefined;
      const info = await bridge?.getAgentInfo?.().catch(() => null);
      if (info && typeof info.url === 'string' && typeof info.token === 'string') {
        return { url: info.url, token: info.token };
      }
      return { url: DEV_AGENT_URL, token: null };
    })();
  }
  return agentRequest;
}

/** Headers every agent request needs: its launch token when there is one. */
export function agentHeaders(endpoint: AgentEndpoint, headers: Headers = new Headers()): Headers {
  if (endpoint.token) headers.set('X-Agent-Token', endpoint.token);
  return headers;
}
