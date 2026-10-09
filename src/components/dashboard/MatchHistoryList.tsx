import React, { useState } from 'react';
import { History, Filter } from 'lucide-react';
import { useMatchHistory } from '../../hooks/useGameState';
import { useAuth } from '../../context/AuthContext';
import { useMatchStream } from '../../hooks/useAnalyticsStream';
import { MatchItem } from './MatchItem';
import { Card, Badge } from '../ui';
import type { MatchRecord } from '../../types/game';

export interface MatchHistoryListProps {
  onSelectMatch: (match: MatchRecord) => void;
}

export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({ onSelectMatch }) => {
  const { matches } = useMatchHistory();
  const { user } = useAuth();
  const [filterMode, setFilterMode] = useState<'ALL' | 'RANKED' | 'NORMAL'>('ALL');

  const list = matches;
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
              Abre una partida para ver su resultado real
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
            {user && matches.length === 0
              ? 'Vincula tu Riot ID en Ajustes para ver tus partidas reales.'
              : user
                ? 'No hay partidas para este filtro.'
                : 'Inicia sesión para ver tus partidas reales.'}
          </div>
        )}
        {rows.map((m) => (
          <MatchItem key={m.matchId} match={m} onSelectMatch={onSelectMatch} />
        ))}
      </div>
    </Card>
  );
};
