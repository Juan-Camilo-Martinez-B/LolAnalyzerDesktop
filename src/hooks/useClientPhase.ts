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
 * Follows the League client's phase (lobby, champion select, game) through the
 * backend, which reads the client locally. In Electron this is the only source
 * for champion select; the in-game agent only reports the match itself.
 * Each change is published once on the event bus.
 */
export function useClientPhase(): void {
  useEffect(() => {
    let last: GamePhase | null = null;
    let active = true;

    const pull = async () => {
      try {
        const agent = await getAgentEndpoint();
        const response = await fetch(`${agent.url}/api/champ-select/gameflow`, {
          headers: agentHeaders(agent),
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) return;
        const body = await response.json() as { phase?: unknown };
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
