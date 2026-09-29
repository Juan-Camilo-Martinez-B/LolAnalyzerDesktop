import React, { useState } from 'react';

export interface SparklinePoint {
  label?: string;
  value: number;
}

export interface SparklineProps {
  data: SparklinePoint[] | number[];
  width?: number;
  height?: number;
  color?: string; // hex or var e.g. '#0AC8B9' or '#C89B3C'
  fillOpacity?: number;
  strokeWidth?: number;
  showPoints?: boolean;
  showGrid?: boolean;
  minVal?: number;
  maxVal?: number;
  className?: string;
  unit?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 240,
  height = 60,
  color = 'var(--hextech-cyan)',
  fillOpacity = 0.15,
  strokeWidth = 2,
  showPoints = true,
  showGrid = false,
  minVal,
  maxVal,
  className = '',
  unit = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className={`sparkline-empty ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}
      >
        No Data
      </div>
    );
  }

  // Normalize points
  const points: SparklinePoint[] = data.map((d, i) =>
    typeof d === 'number' ? { label: `Game ${i + 1}`, value: d } : d
  );

  const values = points.map((p) => p.value);
  const calculatedMin = minVal !== undefined ? minVal : Math.min(...values);
  const calculatedMax = maxVal !== undefined ? maxVal : Math.max(...values);
  const range = calculatedMax - calculatedMin || 1;

  const padding = 8;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const getX = (index: number) => {
    if (points.length === 1) return width / 2;
    return padding + (index / (points.length - 1)) * usableWidth;
  };

  const getY = (value: number) => {
    const normalized = (value - calculatedMin) / range;
    return height - padding - normalized * usableHeight;
  };

  const svgPoints = points.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ');

  // Gradient area path
  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const bottomY = height - padding / 2;
  const areaPath = `M ${firstX} ${bottomY} L ${svgPoints} L ${lastX} ${bottomY} Z`;

  const gradientId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`sparkline-container ${className}`} style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && (
          <g className="sparkline-grid" stroke="var(--border-dark)" strokeDasharray="2,2" strokeWidth="1">
            <line x1={padding} y1={getY(calculatedMax)} x2={width - padding} y2={getY(calculatedMax)} />
            <line x1={padding} y1={getY((calculatedMax + calculatedMin) / 2)} x2={width - padding} y2={getY((calculatedMax + calculatedMin) / 2)} />
            <line x1={padding} y1={getY(calculatedMin)} x2={width - padding} y2={getY(calculatedMin)} />
          </g>
        )}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />

        {/* Interactive Points */}
        {showPoints &&
          points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.value);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 2.5}
                  fill={isHovered ? 'var(--hextech-black)' : color}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${getX(hoveredIdx)}px`,
            top: `${getY(points[hoveredIdx].value) - 30}px`,
            transform: 'translateX(-50%)',
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-gold)',
            color: 'var(--hextech-gold)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {points[hoveredIdx].label ? `${points[hoveredIdx].label}: ` : ''}
          {points[hoveredIdx].value}
          {unit}
        </div>
      )}
    </div>
  );
};
