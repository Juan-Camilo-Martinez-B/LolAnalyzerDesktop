import React from 'react';
import { Clock, Minimize2, Maximize2, Move, Target, Keyboard } from 'lucide-react';
import { useGamePhase, useOverlay } from '../../hooks/useGameState';

export interface OverlayHeaderProps {
  gameTimeSec?: number;
  csPerMin?: number;
}

export const OverlayHeader: React.FC<OverlayHeaderProps> = ({
  gameTimeSec = 872, // 14:32 default
  csPerMin = 7.8,
}) => {
  const { overlay, setMode } = useOverlay();
  const isExpanded = overlay.mode === 'expanded';

  const minutes = Math.floor(gameTimeSec / 60);
  const seconds = gameTimeSec % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const toggleMode = () => {
    setMode(isExpanded ? 'compact' : 'expanded');
  };

  return (
    <div
      className="overlay-header overwolf-drag"
      style={{
        height: '36px',
        background: 'rgba(5, 8, 14, 0.88)',
        borderBottom: '1px solid var(--border-gold)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        cursor: 'move',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Left: Brand logo & Drag Handle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Move size={12} color="var(--hextech-gold)" />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--hextech-gold)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          LolAnalyzer HUD
        </span>
      </div>

      {/* Center: In-Game Clock & CS/min Live Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          <Clock size={12} color="var(--hextech-cyan)" />
          <span>{formattedTime}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--hextech-cyan)', fontWeight: 700 }}>
          <Target size={12} />
          <span>{csPerMin.toFixed(1)} CS/m</span>
        </div>
      </div>

      {/* Right: Shift+F1 Hotkey Hint & Collapse/Expand Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="no-drag">
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-dark)',
            borderRadius: '4px',
            padding: '2px 6px',
          }}
          title="Toggle overlay in-game with hotkey"
        >
          <Keyboard size={10} /> Shift+F1
        </div>

        <button
          onClick={toggleMode}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--hextech-gold)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          title={isExpanded ? 'Collapse HUD' : 'Expand HUD'}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};
