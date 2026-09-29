import React, { useState } from 'react';
import type { TelemetrySnapshot } from '../../types/stats';

export interface TelemetryTimelineChartProps {
  telemetry: TelemetrySnapshot[];
  width?: number;
  height?: number;
}

export const TelemetryTimelineChart: React.FC<TelemetryTimelineChartProps> = ({
  telemetry,
  width = 680,
  height = 180,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fallback mock timeline snapshots if empty
  const defaultTelemetry: TelemetrySnapshot[] = Array.from({ length: 25 }, (_, i) => {
    const min = i + 1;
    const goldDiff = Math.round(Math.sin(i / 3) * 1500 + i * 120 - 400);
    return {
      minute: min,
      cs: min * 8,
      gold: min * 420,
      goldDiff,
      xpDiff: goldDiff * 0.8,
    };
  });

  const data = telemetry.length > 0 ? telemetry : defaultTelemetry;

  const padding = 32;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const goldDiffs = data.map((d) => d.goldDiff ?? 0);
  const maxDiff = Math.max(2000, ...goldDiffs.map(Math.abs));

  const getX = (idx: number) => {
    if (data.length <= 1) return width / 2;
    return padding + (idx / (data.length - 1)) * usableW;
  };

  const getY = (val: number) => {
    // 0 is at center usable height
    const normalized = val / maxDiff; // -1 to +1
    const centerY = height / 2;
    return centerY - normalized * (usableH / 2);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.goldDiff ?? 0)}`).join(' ');

  // Split paths for blue (ahead > 0) vs red (behind < 0) area fill
  const centerY = height / 2;
  const zeroLinePath = `M ${padding} ${centerY} L ${width - padding} ${centerY}`;

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="goldLeadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hextech-cyan)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--hextech-cyan)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldDeficitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-red)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Zero baseline (Even gold) */}
        <line x1={padding} y1={centerY} x2={width - padding} y2={centerY} stroke="var(--border-dark)" strokeWidth="1.5" strokeDasharray="4,4" />

        {/* Dynamic Gold Curve Line */}
        <polyline
          fill="none"
          stroke="var(--hextech-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          filter="drop-shadow(0 0 6px rgba(200, 155, 60, 0.4))"
        />

        {/* Vertex points & timeline minutes */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.goldDiff ?? 0);
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 2.5}
                fill={isHovered ? '#ffffff' : (d.goldDiff ?? 0) >= 0 ? 'var(--hextech-cyan)' : 'var(--accent-red)'}
                stroke="var(--hextech-black)"
                strokeWidth={1.5}
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Minute ticks on bottom axis */}
              {i % 5 === 0 && (
                <text
                  x={cx}
                  y={height - 6}
                  fill="var(--text-muted)"
                  fontSize="0.65rem"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {d.minute}m
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${getX(hoveredIndex)}px`,
            top: `${getY(data[hoveredIndex].goldDiff ?? 0) - 34}px`,
            transform: 'translateX(-50%)',
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-gold)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <span style={{ color: 'var(--hextech-gold)', fontWeight: 600 }}>Min {data[hoveredIndex].minute}: </span>
          <span style={{ color: (data[hoveredIndex].goldDiff ?? 0) >= 0 ? 'var(--hextech-cyan)' : 'var(--accent-red)', fontWeight: 700 }}>
            {(data[hoveredIndex].goldDiff ?? 0) >= 0 ? `+${data[hoveredIndex].goldDiff}` : data[hoveredIndex].goldDiff} Gold
          </span>
        </div>
      )}
    </div>
  );
};
