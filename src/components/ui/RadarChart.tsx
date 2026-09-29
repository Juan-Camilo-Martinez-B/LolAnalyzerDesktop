import React, { useState } from 'react';

export interface RadarDataPoint {
  axis: string;
  value: number; // 0 to 100 scale
  benchmarkValue?: number; // Optional comparison score (e.g. rank average)
}

export interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number; // width & height (square SVG)
  color?: string; // Player polygon color e.g. '#0AC8B9'
  benchmarkColor?: string; // Benchmark polygon color e.g. '#C89B3C'
  showBenchmark?: boolean;
  className?: string;
  levels?: number; // number of concentric polygon webs (default 4)
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 280,
  color = 'var(--hextech-cyan)',
  benchmarkColor = 'var(--hextech-gold)',
  showBenchmark = true,
  className = '',
  levels = 4,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length < 3) {
    return (
      <div className={`radar-empty ${className}`} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Insufficient Radar Axes (min 3)
      </div>
    );
  }

  const center = size / 2;
  const radius = center - 45; // space for labels around perimeter
  const numAxes = data.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  // Helper to convert polar coords to Cartesian
  const getCoordinates = (index: number, val: number, maxVal = 100) => {
    const angle = index * angleSlice - Math.PI / 2; // start top center (-90 deg)
    const r = (Math.min(Math.max(val, 0), maxVal) / maxVal) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate web polygon rings
  const levelPolygons = Array.from({ length: levels }, (_, lIdx) => {
    const levelFactor = (lIdx + 1) / levels;
    const points = data
      .map((_, i) => {
        const { x, y } = getCoordinates(i, levelFactor * 100);
        return `${x},${y}`;
      })
      .join(' ');
    return points;
  });

  // Calculate polygon points for main data
  const playerPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.value);
      return `${x},${y}`;
    })
    .join(' ');

  // Calculate polygon points for benchmark data if present
  const hasBenchmark = showBenchmark && data.some((d) => d.benchmarkValue !== undefined);
  const benchmarkPoints = hasBenchmark
    ? data
        .map((d, i) => {
          const { x, y } = getCoordinates(i, d.benchmarkValue ?? 0);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  const gradientId = `radar-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`radar-chart-container ${className}`} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* Concentric grid webs */}
        {levelPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="var(--border-dark)"
            strokeWidth="1"
            strokeDasharray={idx === levels - 1 ? 'none' : '2,2'}
            opacity={0.6}
          />
        ))}

        {/* Axis line spoke rays */}
        {data.map((_, i) => {
          const outer = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-dark)"
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* Benchmark polygon (e.g., Challenger Avg) */}
        {hasBenchmark && (
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke={benchmarkColor}
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity={0.85}
          />
        )}

        {/* Player Data Polygon */}
        <polygon
          points={playerPoints}
          fill={`url(#${gradientId})`}
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="drop-shadow(0 0 6px rgba(10, 200, 185, 0.4))"
        />

        {/* Axis labels & interactive vertices */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(i, d.value);
          const labelCoords = getCoordinates(i, 122); // slightly outside radius
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              {/* Vertex Dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? '#ffffff' : color}
                stroke={color}
                strokeWidth={2}
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Axis Title */}
              <text
                x={labelCoords.x}
                y={labelCoords.y}
                fill={isHovered ? 'var(--hextech-gold)' : 'var(--text-secondary)'}
                fontSize="0.75rem"
                fontWeight={isHovered ? '700' : '500'}
                fontFamily="var(--font-heading)"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.axis}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Info Box */}
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-gold)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: 'var(--hextech-gold)', fontWeight: 600 }}>{data[hoveredIndex].axis}: </span>
          <span style={{ color: color, fontWeight: 700 }}>{data[hoveredIndex].value}/100</span>
          {hasBenchmark && data[hoveredIndex].benchmarkValue !== undefined && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.7rem' }}>
              (Avg: {data[hoveredIndex].benchmarkValue})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
