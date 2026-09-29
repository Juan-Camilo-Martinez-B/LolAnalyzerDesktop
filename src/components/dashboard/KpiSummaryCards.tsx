import React from 'react';
import { Target, Zap, Eye, Swords, TrendingUp } from 'lucide-react';
import { useKpi } from '../../hooks/useGameState';
import { Card, StatMetric, Badge, ProgressBar } from '../ui';
import { Sparkline } from '../ui/Sparkline';

export const KpiSummaryCards: React.FC = () => {
  const { kpi } = useKpi();

  // Mock / default KPI values when backend data is pending
  const kdaRatio = kpi?.kda ?? 3.84;
  const avgKills = kpi?.avgKills ?? 7.4;
  const avgDeaths = kpi?.avgDeaths ?? 3.2;
  const avgAssists = kpi?.avgAssists ?? 8.6;

  const csPerMin = kpi?.avgCSPerMin ?? 7.8;
  const dmgPerGold = kpi?.damagePerGold ?? 1.28;
  const visionPerMin = kpi?.visionScorePerMin ?? 1.45;
  const killParticipation = kpi?.killParticipationPct ?? 64.5;

  // History sparkline trends
  const kdaHistory = [3.1, 3.4, 2.9, 4.2, 3.8, 4.5, 3.84];
  const csHistory = [6.9, 7.1, 7.5, 7.2, 8.0, 7.6, 7.8];
  const dmgHistory = [1.12, 1.18, 1.25, 1.22, 1.35, 1.28];
  const kpHistory = [55, 60, 58, 62, 70, 64.5];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}
    >
      {/* CARD 1: KDA Ratio */}
      <Card variant="gold" className="kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Swords size={14} color="var(--hextech-gold)" /> KDA Ratio
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--hextech-gold)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
              {kdaRatio.toFixed(2)}
            </div>
          </div>
          <Badge variant="gold" icon={<TrendingUp size={10} />}>
            +0.45 vs Avg
          </Badge>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{avgKills}</span> /{' '}
          <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{avgDeaths}</span> /{' '}
          <span style={{ color: 'var(--hextech-cyan)', fontWeight: 700 }}>{avgAssists}</span> avg per game
        </div>

        <Sparkline data={kdaHistory} height={36} color="var(--hextech-gold)" showPoints={false} />
      </Card>

      {/* CARD 2: CS / Min */}
      <Card variant="cyan" className="kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Target size={14} color="var(--hextech-cyan)" /> Farming CS / Min
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--hextech-cyan)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
              {csPerMin.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>CS/m</span>
            </div>
          </div>
          <Badge variant="cyan">High Efficiency</Badge>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Target 8.0 CS/m</span>
            <span>{((csPerMin / 8.0) * 100).toFixed(0)}%</span>
          </div>
          <ProgressBar value={(csPerMin / 10.0) * 100} variant="cyan" height={5} />
        </div>

        <Sparkline data={csHistory} height={36} color="var(--hextech-cyan)" showPoints={false} />
      </Card>

      {/* CARD 3: Damage per Gold */}
      <Card variant="default" className="kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Zap size={14} color="var(--accent-red)" /> Dmg / Gold Ratio
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
              {dmgPerGold.toFixed(2)}
            </div>
          </div>
          <Badge variant="win">S Tier</Badge>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Converts gold into game impact efficiently
        </div>

        <Sparkline data={dmgHistory} height={36} color="var(--accent-red)" showPoints={false} />
      </Card>

      {/* CARD 4: Vision & Kill Participation */}
      <Card variant="default" className="kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Eye size={14} color="var(--hextech-cyan)" /> Vision & Team KP%
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
              {killParticipation.toFixed(1)}% <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>KP</span>
            </div>
          </div>
          <Badge variant="neutral">{visionPerMin.toFixed(2)} Vis/m</Badge>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Map Presence</span>
            <span>{killParticipation > 60 ? 'Optimal' : 'Needs Work'}</span>
          </div>
          <ProgressBar value={killParticipation} variant="gold" height={5} />
        </div>

        <Sparkline data={kpHistory} height={36} color="var(--hextech-gold)" showPoints={false} />
      </Card>
    </div>
  );
};
