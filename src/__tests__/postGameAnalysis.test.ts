import { describe, expect, it } from 'vitest';
import { isFreshAnalysis, type MatchAnalysis } from '../services/analysisClient';
import { RETRY_DELAYS_MS, isGameOver } from '../hooks/usePostGameAnalysis';

const analysis = (createdAt: string | null) => ({ createdAt } as MatchAnalysis);

describe('post-game analysis', () => {
  it('only treats leaving a game as game over', () => {
    expect(isGameOver('IN_GAME', 'END_OF_GAME')).toBe(true);
    expect(isGameOver('IN_GAME', 'LOBBY')).toBe(true);
    expect(isGameOver('CHAMP_SELECT', 'IN_GAME')).toBe(false);
    expect(isGameOver(null, 'END_OF_GAME')).toBe(false);
  });

  it('accepts only an analysis written after the game ended', () => {
    const ended = Date.parse('2026-11-07T20:00:00Z');
    expect(isFreshAnalysis(analysis('2026-11-07T20:01:00Z'), ended)).toBe(true);
    expect(isFreshAnalysis(analysis('2026-11-07T19:30:00Z'), ended)).toBe(false);
    expect(isFreshAnalysis(analysis(null), ended)).toBe(false);
    expect(isFreshAnalysis(null, ended)).toBe(false);
  });

  it('retries a few times with growing gaps', () => {
    expect(RETRY_DELAYS_MS.length).toBeLessThanOrEqual(4);
    expect([...RETRY_DELAYS_MS].sort((a, b) => a - b)).toEqual(RETRY_DELAYS_MS);
  });
});
