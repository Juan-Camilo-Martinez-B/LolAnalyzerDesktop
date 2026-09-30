import React, { useState } from 'react';
import { Search, Trophy, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useChampionPerformance } from '../../hooks/useGameState';
import { useChampionStream } from '../../hooks/useAnalyticsStream';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Card, Badge } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import type { ChampionPerformance } from '../../types/stats';
import type { ChampionSortField } from '../../workers/analyticsCore';

const DEFAULT_CHAMPIONS: ChampionPerformance[] = [
  { championId: 103, championName: 'Ahri', role: 'MID', games: 42, wins: 26, winrate: 61.9, kda: 3.8, avgCSPerMin: 7.9, mastery: 124500, masteryLevel: 7, recentTrend: 'up' },
  { championId: 84, championName: 'Akali', role: 'MID', games: 28, wins: 17, winrate: 60.7, kda: 3.4, avgCSPerMin: 7.4, mastery: 89200, masteryLevel: 6, recentTrend: 'up' },
  { championId: 157, championName: 'Yasuo', role: 'MID', games: 22, wins: 11, winrate: 50.0, kda: 2.3, avgCSPerMin: 8.2, mastery: 156000, masteryLevel: 7, recentTrend: 'down' },
  { championId: 222, championName: 'Jinx', role: 'ADC', games: 19, wins: 13, winrate: 68.4, kda: 4.2, avgCSPerMin: 8.6, mastery: 64100, masteryLevel: 5, recentTrend: 'up' },
  { championId: 64, championName: 'LeeSin', role: 'JUNGLE', games: 15, wins: 8, winrate: 53.3, kda: 2.9, avgCSPerMin: 5.8, mastery: 98400, masteryLevel: 6, recentTrend: 'stable' },
];

export const ChampionPerformanceTable: React.FC = () => {
  const { champions } = useChampionPerformance();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<ChampionSortField>('games');
  const [sortAsc, setSortAsc] = useState(false);

  const dataList = champions.length > 0 ? champions : DEFAULT_CHAMPIONS;
  const { rows, streaming } = useChampionStream(dataList, searchQuery, sortField, sortAsc);

  const handleSort = (field: ChampionSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <Card variant="default">
      {/* Header & Controls */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={20} color="var(--hextech-gold)" />
          <div>
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
              Champion Mastery & Role Performance
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Stat breakdown based on last {dataList.reduce((acc, c) => acc + c.games, 0)} games
              {streaming && <span className="stream-hint" style={{ marginLeft: 8 }}>Actualizando</span>}
            </div>
          </div>
        </div>

        {/* Search Bar Input */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0, maxWidth: '280px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search champion or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-glass-heavy)',
              border: '1px solid var(--border-dark)',
              borderRadius: '6px',
              padding: '6px 12px 6px 32px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="scroll-region scroll-region--table" tabIndex={0} aria-label="Tabla de campeones">
        <table className="data-table">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-dark)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleSort('championName')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Champion <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '10px 12px' }}>Role</th>
              <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleSort('games')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Games <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleSort('winrate')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Win Rate <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleSort('kda')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  KDA <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '10px 12px' }}>CS / Min</th>
              <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleSort('mastery')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Mastery <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '10px 12px' }}>Trend</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c) => {
              const roleEmblem = assetResolver.getRoleEmblem(c.role);

              return (
                <tr
                  key={c.championId}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.15s ease',
                  }}
                  className="table-row-hover"
                >
                  {/* Champion Avatar & Name */}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ChampionAvatar
                        championName={c.championName}
                        size="sm"
                        masteryLevel={c.masteryLevel}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.championName}</span>
                    </div>
                  </td>

                  {/* Role Icon */}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img
                        src={roleEmblem}
                        alt={c.role}
                        style={{ width: '18px', height: '18px', filter: 'brightness(0.9)' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.role}</span>
                    </div>
                  </td>

                  {/* Games Played */}
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.games}G</td>

                  {/* Winrate */}
                  <td style={{ padding: '10px 12px' }}>
                    <Badge variant={c.winrate >= 60 ? 'win' : c.winrate >= 50 ? 'gold' : 'loss'}>
                      {c.winrate.toFixed(1)}%
                    </Badge>
                  </td>

                  {/* KDA Ratio */}
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: c.kda >= 3.5 ? 'var(--hextech-gold)' : c.kda >= 2.5 ? 'var(--hextech-cyan)' : 'var(--text-primary)',
                      }}
                    >
                      {c.kda.toFixed(2)}
                    </span>
                  </td>

                  {/* CS Per Min */}
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {c.avgCSPerMin.toFixed(1)}
                  </td>

                  {/* Mastery Points */}
                  <td style={{ padding: '10px 12px', color: 'var(--hextech-gold)', fontWeight: 600 }}>
                    {(c.mastery / 1000).toFixed(1)}k pts
                  </td>

                  {/* Recent Trend */}
                  <td style={{ padding: '10px 12px' }}>
                    {c.recentTrend === 'up' && <TrendingUp size={16} color="var(--accent-green)" />}
                    {c.recentTrend === 'down' && <TrendingDown size={16} color="var(--accent-red)" />}
                    {c.recentTrend === 'stable' && <Minus size={16} color="var(--text-muted)" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
