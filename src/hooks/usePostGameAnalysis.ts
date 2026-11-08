import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '../services/eventBus';
import { analyzeLatest, isFreshAnalysis, type MatchAnalysis } from '../services/analysisClient';
import { syncClientHistory } from '../services/backendAuth';

/**
 * The client writes the finished game to its history a little after the
 * end screen, so the analysis is requested a few times with growing gaps.
 */
export const RETRY_DELAYS_MS = [15_000, 45_000, 90_000, 150_000];

/** Leaving a game means its final summary is (or will soon be) available. */
export function isGameOver(previous: string | null, next: string): boolean {
  return previous === 'IN_GAME' && next !== 'IN_GAME';
}

export function usePostGameAnalysis(): { analysis: MatchAnalysis | null; dismiss: () => void } {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const previousPhase = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => {
    const stop = eventBus.on('game:phase_changed', ({ phase }) => {
      const gameOver = isGameOver(previousPhase.current, phase);
      previousPhase.current = phase;
      if (!gameOver) return;

      clearTimers();
      const endedAt = Date.now();
      let found = false;
      RETRY_DELAYS_MS.forEach((delay) => {
        timers.current.push(window.setTimeout(() => {
          if (found) return;
          // The agent copies the finished game to the account before the cloud analyses it.
          void syncClientHistory().then(() => analyzeLatest())
            .then((result) => {
              // An older stored analysis means the new game is not in the history yet.
              if (!found && isFreshAnalysis(result, endedAt)) {
                found = true;
                clearTimers();
                setAnalysis(result);
                // The finished game is stored now: the dashboard can reload.
                eventBus.emit('history:updated');
              }
            })
            .catch(() => {
              // The next attempt retries; the match list can still analyse it later.
            });
        }, delay));
      });
    });
    return () => {
      stop();
      clearTimers();
    };
  }, []);

  const dismiss = useCallback(() => setAnalysis(null), []);
  return { analysis, dismiss };
}
