import { useEffect } from 'react';
import { eventBus } from '../services/eventBus';
import { mapGameflowPhase } from '../services/lcuService';
import type { GamePhase } from '../types/game';
import { agentHeaders, getAgentEndpoint } from '../services/endpoints';

export const CLIENT_PHASE_POLL_MS = 3000;

/** Should the app jump to the champion select tab for this phase change? */
export function shouldOpenChampSelect(previous: GamePhase | null, next: GamePhase, enabled: boolean): boolean {
  return enabled && next === 'CHAMP_SELECT' && previous !== 'CHAMP_SELECT';
}

/**
 * Did the client just become reachable? The first answer counts too, so a
 * client that was already open when the app started is reported once.
 */
export function clientJustConnected(previous: boolean | null, connected: boolean): boolean {
  return connected && previous !== true;
}

/**
 * Follows the League client's phase (lobby, champion select, game) through the
 * backend, which reads the client locally. In Electron this is the only source
 * for champion select; the in-game agent only reports the match itself.
 * Each change is published once on the event bus, and so is the client
 * opening or closing, so data that needs the client can load late.
 */
export function useClientPhase(): void {
  useEffect(() => {
    let last: GamePhase | null = null;
    let wasConnected: boolean | null = null;
    let active = true;

    const reportConnection = (connected: boolean) => {
      if (!active) return;
      if (clientJustConnected(wasConnected, connected)) eventBus.emit('lcu:connected');
      else if (!connected && wasConnected === true) eventBus.emit('lcu:disconnected');
      wasConnected = connected;
    };

    const pull = async () => {
      try {
        const agent = await getAgentEndpoint();
        const response = await fetch(`${agent.url}/api/champ-select/gameflow`, {
          headers: agentHeaders(agent),
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) return;
        const body = await response.json() as { phase?: unknown; connected?: unknown };
        reportConnection(body.connected !== false);
        const phase = mapGameflowPhase(typeof body.phase === 'string' ? body.phase : 'None');
        if (active && phase !== last) {
          last = phase;
          eventBus.emit('game:phase_changed', { phase });
        }
      } catch {
        // Backend or client closed: keep the last known phase and try again.
      }
    };

    void pull();
    const timer = window.setInterval(() => void pull(), CLIENT_PHASE_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
}
