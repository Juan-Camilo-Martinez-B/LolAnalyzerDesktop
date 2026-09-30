import type { MatchRecord } from '../types/game';
import type { ChampionPerformance } from '../types/stats';

export type QueueFilter = 'ALL' | 'RANKED' | 'NORMAL';
export type ChampionSortField = 'winrate' | 'games' | 'kda' | 'mastery' | 'championName';

export interface MatchSummary {
  count: number;
  winrate: number;
  avgKda: number;
  avgDeaths: number;
}

const CHUNK_SIZE = 8;

export function chunkItems<T>(items: readonly T[], size = CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function filterMatches(matches: readonly MatchRecord[], mode: QueueFilter): MatchRecord[] {
  return matches.filter((match) => {
    const name = (match.gameMode ?? '').toLowerCase();
    if (mode === 'RANKED') return name.includes('ranked');
    if (mode === 'NORMAL') return name.includes('normal');
    return true;
  });
}

export function summarizeMatches(matches: readonly MatchRecord[]): MatchSummary {
  const count = matches.length;
  if (count === 0) return { count: 0, winrate: 0, avgKda: 0, avgDeaths: 0 };

  let wins = 0;
  let kda = 0;
  let deaths = 0;
  for (const match of matches) {
    if (match.isWin ?? match.win) wins += 1;
    kda += match.kda ?? 0;
    deaths += match.deaths ?? 0;
  }

  return {
    count,
    winrate: Math.round((wins / count) * 100),
    avgKda: Number((kda / count).toFixed(2)),
    avgDeaths: Number((deaths / count).toFixed(2)),
  };
}

export function rankChampions(
  champions: readonly ChampionPerformance[],
  query: string,
  sortField: ChampionSortField,
  sortAsc: boolean,
): ChampionPerformance[] {
  const needle = query.trim().toLowerCase();
  const filtered = champions.filter((champion) => {
    if (!needle) return true;
    return champion.championName.toLowerCase().includes(needle)
      || champion.role.toLowerCase().includes(needle);
  });

  return filtered.slice().sort((a, b) => {
    const left = a[sortField];
    const right = b[sortField];
    if (typeof left === 'string' && typeof right === 'string') {
      const order = left.toLowerCase().localeCompare(right.toLowerCase());
      return sortAsc ? order : -order;
    }
    const delta = Number(left) - Number(right);
    if (delta === 0) return 0;
    return sortAsc ? (delta < 0 ? -1 : 1) : (delta < 0 ? 1 : -1);
  });
}
