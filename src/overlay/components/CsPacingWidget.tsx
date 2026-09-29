import React from 'react';
import { Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Badge, ProgressBar } from '../../components/ui';

export interface CsPacingWidgetProps {
  currentCs?: number;
  gameTimeSec?: number;
  targetCsPerMin?: number;
}

export const CsPacingWidget: React.FC<CsPacingWidgetProps> = ({
  currentCs = 118,
  gameTimeSec = 872, // 14m 32s
  targetCsPerMin = 9.0,
}) => {
  const currentMinutes = Math.max(1, gameTimeSec / 60);
  const currentCsPerMin = currentCs / currentMinutes;

  const targetCs = Math.round(targetCsPerMin * currentMinutes);
  const csDelta = currentCs - targetCs;
  const isAhead = csDelta >= 0;

  const pacingPct = Math.min(100, Math.max(0, (currentCs / Math.max(1, targetCs)) * 100));

  return (
    <div
      style={{
        background: 'rgba(11, 14, 20, 0.92)',
        border: '1px solid var(--border-dark)',
        borderRadius: '8px',
        padding: '10px 14px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <Target size={14} color="var(--hextech-cyan)" /> CS Pacing Tracker
        </div>
        <Badge variant={isAhead ? 'win' : 'gold'}>
          {isAhead ? `+${csDelta} vs Baseline` : `${csDelta} vs Baseline`}
        </Badge>
      </div>

      {/* Main Numbers: Current CS vs Target */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--hextech-cyan)', fontFamily: 'var(--font-heading)' }}>
            {currentCs}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
            CS ({currentCsPerMin.toFixed(1)}/m)
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
          <span style={{ color: 'var(--hextech-gold)', fontWeight: 700 }}>{targetCs}</span> Target ({targetCsPerMin} /m)
        </div>
      </div>

      {/* Pacing Progress Bar */}
      <ProgressBar value={pacingPct} variant={isAhead ? 'cyan' : 'gold'} height={5} />
    </div>
  );
};
