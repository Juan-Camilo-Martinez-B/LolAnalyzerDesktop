import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../types/game';
import type { ChampionPerformance } from '../types/stats';
import { chunkItems, filterMatches, rankChampions, summarizeMatches } from '../workers/analyticsCore';

const matches: MatchRecord[] = [
  { matchId: '1', gameMode: 'Ranked Solo', isWin: true, kda: 4, deaths: 2 },
  { matchId: '2', gameMode: 'Normal 5v5', isWin: false, kda: 1, deaths: 6 },
  { matchId: '3', gameMode: 'Ranked Flex', isWin: true, kda: 3, deaths: 1 },
];

const champions: ChampionPerformance[] = [
  { championId: 1, championName: 'Ahri', role: 'MID', games: 10, wins: 6, winrate: 60, kda: 3, avgCSPerMin: 7, mastery: 1000, masteryLevel: 5, recentTrend: 'up' },
  { championId: 2, championName: 'Jinx', role: 'ADC', games: 4, wins: 1, winrate: 25, kda: 1.2, avgCSPerMin: 8, mastery: 400, masteryLevel: 3, recentTrend: 'down' },
];

describe('analytics core', () => {
  it('filters queues and summarizes the visible set', () => {
    const ranked = filterMatches(matches, 'RANKED');
    expect(ranked.map((match) => match.matchId)).toEqual(['1', '3']);
    expect(summarizeMatches(ranked)).toEqual({ count: 2, winrate: 100, avgKda: 3.5, avgDeaths: 1.5 });
    expect(filterMatches(matches, 'NORMAL')).toHaveLength(1);
  });

  it('splits results into chunks without mutating the champion ranking', () => {
    const original = champions.map((champion) => champion.championName);
    const ranked = rankChampions(champions, 'ahri', 'winrate', false);
    expect(ranked.map((champion) => champion.championName)).toEqual(['Ahri']);
    expect(rankChampions(champions, '', 'games', false).map((champion) => champion.championName)).toEqual(['Ahri', 'Jinx']);
    expect(champions.map((champion) => champion.championName)).toEqual(original);
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
