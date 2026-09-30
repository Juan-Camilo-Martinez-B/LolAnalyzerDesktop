import { startTransition, useEffect, useState } from 'react';
import type { MatchRecord } from '../types/game';
import type { ChampionPerformance } from '../types/stats';
import {
  filterMatches,
  rankChampions,
  summarizeMatches,
  type ChampionSortField,
  type MatchSummary,
  type QueueFilter,
} from '../workers/analyticsCore';
import type { AnalyticsRequest, AnalyticsResponse } from '../workers/analytics.worker';

const CHUNK_SIZE = 4;

let sharedWorker: Worker | null | undefined;
let nextRequestId = 1;

function getAnalyticsWorker(): Worker | null {
  if (sharedWorker !== undefined) return sharedWorker;
  if (typeof Worker === 'undefined') {
    sharedWorker = null;
    return null;
  }
  try {
    sharedWorker = new Worker(new URL('../workers/analytics.worker.ts', import.meta.url), { type: 'module' });
    return sharedWorker;
  } catch {
    sharedWorker = null;
    return null;
  }
}

function paintOnMain<T>(items: readonly T[], setRows: (rows: T[]) => void) {
  let combined: T[] = [];
  for (let index = 0; index < items.length; index += CHUNK_SIZE) {
    combined = combined.concat(items.slice(index, index + CHUNK_SIZE));
    const snapshot = combined.slice();
    startTransition(() => setRows(snapshot));
  }
  if (items.length === 0) startTransition(() => setRows([]));
}

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useMatchStream(matches: readonly MatchRecord[], mode: QueueFilter) {
  const initial = filterMatches(matches, mode);
  const [rows, setRows] = useState<MatchRecord[]>(() => initial.slice(0, CHUNK_SIZE));
  const [summary, setSummary] = useState<MatchSummary>(() => summarizeMatches(initial));
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const requestId = nextRequestId++;
    const filtered = filterMatches(matches, mode);
    const worker = getAnalyticsWorker();
    setStreaming(true);
    startTransition(() => setSummary(summarizeMatches(filtered)));

    if (!worker) {
      paintOnMain(filtered, setRows);
      startTransition(() => setStreaming(false));
      return;
    }

    let received = 0;
    const onMessage = (event: MessageEvent<AnalyticsResponse>) => {
      if (event.data.id !== requestId) return;
      if (event.data.type === 'chunk') {
        const items = event.data.items as MatchRecord[];
        received += 1;
        startTransition(() => {
          setRows((current) => (received === 1 ? items : current.concat(items)));
        });
      }
      if (event.data.type === 'done') {
        const summary = event.data.summary;
        if (summary) startTransition(() => setSummary(summary));
        startTransition(() => setStreaming(false));
      }
    };

    const onError = () => {
      paintOnMain(filtered, setRows);
      startTransition(() => setStreaming(false));
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    const request: AnalyticsRequest = { id: requestId, type: 'matches', matches: [...matches], mode };
    worker.postMessage(request);

    return () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
  }, [matches, mode]);

  return { rows, summary, streaming };
}

export function useChampionStream(
  champions: readonly ChampionPerformance[],
  query: string,
  sortField: ChampionSortField,
  sortAsc: boolean,
) {
  const debouncedQuery = useDebounced(query, 80);
  const initial = rankChampions(champions, debouncedQuery, sortField, sortAsc);
  const [rows, setRows] = useState<ChampionPerformance[]>(() => initial.slice(0, CHUNK_SIZE));
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const requestId = nextRequestId++;
    const ranked = rankChampions(champions, debouncedQuery, sortField, sortAsc);
    const worker = getAnalyticsWorker();
    setStreaming(true);

    if (!worker) {
      paintOnMain(ranked, setRows);
      startTransition(() => setStreaming(false));
      return;
    }

    let received = 0;
    const onMessage = (event: MessageEvent<AnalyticsResponse>) => {
      if (event.data.id !== requestId) return;
      if (event.data.type === 'chunk') {
        const items = event.data.items as ChampionPerformance[];
        received += 1;
        startTransition(() => {
          setRows((current) => (received === 1 ? items : current.concat(items)));
        });
      }
      if (event.data.type === 'done') {
        startTransition(() => setStreaming(false));
      }
    };

    const onError = () => {
      paintOnMain(ranked, setRows);
      startTransition(() => setStreaming(false));
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    const request: AnalyticsRequest = {
      id: requestId,
      type: 'champions',
      champions: [...champions],
      query: debouncedQuery,
      sortField,
      sortAsc,
    };
    worker.postMessage(request);

    return () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
  }, [champions, debouncedQuery, sortField, sortAsc]);

  return { rows, streaming };
}
