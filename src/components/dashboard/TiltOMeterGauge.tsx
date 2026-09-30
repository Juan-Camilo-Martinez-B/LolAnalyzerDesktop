import React, { useState } from 'react';
import { Brain, Flame, AlertOctagon, HeartPulse, RefreshCw } from 'lucide-react';
import { useTilt } from '../../hooks/useGameState';
import { tiltBand, tiltBandLabel, type TiltBand } from '../../services/tiltCalculations';
import { Card, Badge } from '../ui';
import { audioService } from '../../services/audioService';

export const TiltOMeterGauge: React.FC = () => {
  const { tiltIndex } = useTilt();
  const [testTilt, setTestTilt] = useState<number | null>(null);

  const displayTilt = testTilt !== null ? testTilt : tiltIndex;

  const band = tiltBand(displayTilt);
  const categoryCopy: Record<TiltBand, { color: string; icon: React.ReactNode; desc: string }> = {
    zen: { color: 'var(--accent-green)', icon: <Brain size={16} />, desc: 'Mindset óptimo. Enfoque mental perfecto.' },
    focused: { color: 'var(--hextech-cyan)', icon: <HeartPulse size={16} />, desc: 'Estado de concentración estable.' },
    frustrated: { color: 'var(--hextech-gold)', icon: <Flame size={16} />, desc: 'Riesgo de decisiones impulsivas.' },
    critical: { color: 'var(--accent-red)', icon: <AlertOctagon size={16} />, desc: 'ALERTA: Se recomienda pausa de 15 min.' },
  };
  const currentCategory = { label: tiltBandLabel(band), ...categoryCopy[band] };

  // SVG Semi-circle Arc math
  const size = 200;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = Math.PI * radius; // Half circle perimeter
  const strokeDashoffset = circumference - (displayTilt / 100) * circumference;

  const handleSimulateTilt = () => {
    audioService.playWarning();
    const nextTilt = displayTilt >= 85 ? 15 : displayTilt + 30;
    setTestTilt(nextTilt);
  };

  return (
    <Card variant={displayTilt > 75 ? 'danger' : displayTilt > 50 ? 'gold' : 'default'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={18} color={currentCategory.color} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mental Tilt-o-Meter
          </span>
        </div>
        <Badge variant={displayTilt > 75 ? 'danger' : displayTilt > 50 ? 'gold' : 'win'}>
          {currentCategory.label}
        </Badge>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
        {/* Semi-Circle SVG Arc Gauge */}
        <div style={{ position: 'relative', width: size, height: size / 2 + 20, display: 'flex', justifyContent: 'center' }}>
          <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
            <defs>
              <linearGradient id="tiltGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-green)" />
                <stop offset="35%" stopColor="var(--hextech-cyan)" />
                <stop offset="70%" stopColor="var(--hextech-gold)" />
                <stop offset="100%" stopColor="var(--accent-red)" />
              </linearGradient>
            </defs>

            {/* Background Track Arc */}
            <path
              d={`M ${strokeWidth},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${center}`}
              fill="none"
              stroke="var(--border-dark)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Colored Active Arc */}
            <path
              d={`M ${strokeWidth},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${center}`}
              fill="none"
              stroke="url(#tiltGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
            />
          </svg>

          {/* Center Value Counter */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: currentCategory.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
              {displayTilt}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Index Score
            </div>
          </div>
        </div>

        {/* Status Description & Advice */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: currentCategory.color, fontWeight: 700, fontSize: '0.95rem' }}>
            {currentCategory.icon}
            <span>{currentCategory.label}</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            {currentCategory.desc}
          </p>

          <button
            onClick={handleSimulateTilt}
            style={{
              background: 'var(--bg-glass-medium)',
              border: `1px solid ${currentCategory.color}`,
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={12} /> Test Tilt Spike
          </button>
        </div>
      </div>
    </Card>
  );
};
