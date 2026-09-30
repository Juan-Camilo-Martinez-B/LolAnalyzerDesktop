import {
  chunkItems,
  filterMatches,
  rankChampions,
  summarizeMatches,
  type ChampionSortField,
  type QueueFilter,
} from './analyticsCore';
import type { MatchRecord } from '../types/game';
import type { ChampionPerformance } from '../types/stats';

export type AnalyticsRequest =
  | { id: number; type: 'matches'; matches: MatchRecord[]; mode: QueueFilter }
  | {
      id: number;
      type: 'champions';
      champions: ChampionPerformance[];
      query: string;
      sortField: ChampionSortField;
      sortAsc: boolean;
    };

export type AnalyticsResponse =
  | { id: number; type: 'chunk'; items: unknown[] }
  | { id: number; type: 'done'; summary?: ReturnType<typeof summarizeMatches> };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AnalyticsRequest>) => void) | null;
  postMessage: (message: AnalyticsResponse) => void;
};

scope.onmessage = (event) => {
  const request = event.data;

  if (request.type === 'matches') {
    const filtered = filterMatches(request.matches, request.mode);
    const chunks = chunkItems(filtered);
    if (chunks.length === 0) {
      scope.postMessage({ id: request.id, type: 'chunk', items: [] });
    } else {
      for (const items of chunks) {
        scope.postMessage({ id: request.id, type: 'chunk', items });
      }
    }
    scope.postMessage({ id: request.id, type: 'done', summary: summarizeMatches(filtered) });
    return;
  }

  const ranked = rankChampions(request.champions, request.query, request.sortField, request.sortAsc);
  const chunks = chunkItems(ranked);
  if (chunks.length === 0) {
    scope.postMessage({ id: request.id, type: 'chunk', items: [] });
  } else {
    for (const items of chunks) {
      scope.postMessage({ id: request.id, type: 'chunk', items });
    }
  }
  scope.postMessage({ id: request.id, type: 'done' });
};
