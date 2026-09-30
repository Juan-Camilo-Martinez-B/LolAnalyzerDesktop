import React, { useState } from 'react';
import { History, Filter } from 'lucide-react';
import { useMatchHistory } from '../../hooks/useGameState';
import { useMatchStream } from '../../hooks/useAnalyticsStream';
import { MatchItem } from './MatchItem';
import { Card, Badge } from '../ui';
import type { MatchRecord } from '../../types/game';

const DEFAULT_MATCHES: MatchRecord[] = [
  { matchId: 'LA1_10293841', gameMode: 'Ranked Solo', durationSec: 1724, isWin: true, championName: 'Ahri', role: 'MID', kills: 11, deaths: 2, assists: 9, kda: 10.0, cs: 234, csPerMin: 8.15, timestamp: '2026-09-29T09:30:00Z', items: [3006, 6672, 3031, 3072, 3033, 3156], trinketId: 3363 },
  { matchId: 'LA1_10293842', gameMode: 'Ranked Solo', durationSec: 1980, isWin: true, championName: 'Akali', role: 'MID', kills: 14, deaths: 4, assists: 6, kda: 5.0, cs: 245, csPerMin: 7.42, timestamp: '2026-09-28T21:15:00Z', items: [3152, 3020, 3135, 3089, 3157, 4637], trinketId: 3364 },
  { matchId: 'LA1_10293843', gameMode: 'Ranked Solo', durationSec: 1450, isWin: false, championName: 'Yasuo', role: 'MID', kills: 3, deaths: 7, assists: 2, kda: 0.71, cs: 180, csPerMin: 7.45, timestamp: '2026-09-28T19:00:00Z', items: [3006, 6672, 3031, 1055, 0, 0], trinketId: 3330 },
  { matchId: 'LA1_10293844', gameMode: 'Normal 5v5', durationSec: 1810, isWin: true, championName: 'Jinx', role: 'ADC', kills: 16, deaths: 3, assists: 12, kda: 9.33, cs: 278, csPerMin: 9.21, timestamp: '2026-09-27T16:40:00Z', items: [3006, 6672, 3031, 3072, 3033, 3156], trinketId: 3363 },
  { matchId: 'LA1_10293845', gameMode: 'Ranked Solo', durationSec: 2150, isWin: true, championName: 'LeeSin', role: 'JUNGLE', kills: 8, deaths: 4, assists: 15, kda: 5.75, cs: 195, csPerMin: 5.44, timestamp: '2026-09-27T14:20:00Z', items: [3077, 3111, 6632, 3053, 3075, 3143], trinketId: 3364 },
];

export interface MatchHistoryListProps {
  onSelectMatch: (matchId: string) => void;
}

export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({ onSelectMatch }) => {
  const { matches } = useMatchHistory();
  const [filterMode, setFilterMode] = useState<'ALL' | 'RANKED' | 'NORMAL'>('ALL');

  const list = matches.length > 0 ? matches : DEFAULT_MATCHES;
  const { rows, summary, streaming } = useMatchStream(list, filterMode);

  return (
    <Card variant="default">
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={20} color="var(--hextech-cyan)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.04em',
                  margin: 0,
                }}
              >
                Recent Matches
              </h3>
              <Badge variant="cyan">{summary.winrate}% WR (Last {summary.count})</Badge>
              {streaming && <span className="stream-hint">Actualizando</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Click any match for telemetry timeline drilldown
            </div>
          </div>
        </div>

        {/* Queue Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Filter size={14} color="var(--text-muted)" style={{ marginRight: '4px' }} />
          {(['ALL', 'RANKED', 'NORMAL'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                background: filterMode === mode ? 'var(--hextech-gold)' : 'var(--bg-glass-heavy)',
                color: filterMode === mode ? 'var(--hextech-black)' : 'var(--text-secondary)',
                border: '1px solid var(--border-dark)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-region" tabIndex={0} aria-label="Lista de partidas">
        {rows.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 0' }}>
            No hay partidas para este filtro.
          </div>
        )}
        {rows.map((m) => (
          <MatchItem key={m.matchId} match={m} onSelectMatch={onSelectMatch} />
        ))}
      </div>
    </Card>
  );
};
