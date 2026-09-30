import React from 'react';
import { Clock, Maximize2, SlidersHorizontal, Target } from 'lucide-react';

export interface MiniHudBarProps {
  gameTimeSec: number;
  csPerMin: number;
  csDelta: number;
  tiltActive: boolean;
  tiltLabel?: string;
  controlsOpen: boolean;
  onExpand: () => void;
  onToggleControls: () => void;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** One-line HUD: tilt status + CS/min. Stays out of the minimap and ability bar. */
export const MiniHudBar: React.FC<MiniHudBarProps> = ({
  gameTimeSec,
  csPerMin,
  csDelta,
  tiltActive,
  tiltLabel = 'Tilt',
  controlsOpen,
  onExpand,
  onToggleControls,
}) => {
  const ahead = csDelta >= 0;
  const deltaLabel = `${ahead ? '+' : ''}${csDelta.toFixed(1)}`;

  return (
    <div className="mini-hud overlay-drag" title="Arrastra para reubicar el Mini-HUD">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--slate-200)', fontSize: '0.72rem', fontWeight: 700 }}>
        <Clock size={12} color="var(--cyan-400)" />
        {formatClock(gameTimeSec)}
      </span>

      <span
        className={`mini-hud-tilt ${tiltActive ? 'is-alert' : 'is-stable'}`}
        title={tiltActive ? tiltLabel : 'Estabilidad emocional en rango'}
      >
        <span className="mini-hud-dot" />
        {tiltActive ? 'Tilt' : 'Estable'}
      </span>

      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: 'var(--cyan-400)', fontSize: '0.72rem', fontWeight: 800 }}>
        <Target size={12} />
        {csPerMin.toFixed(1)}
        <span style={{ color: ahead ? 'var(--green-400)' : 'var(--gold-300)', fontWeight: 700 }}>
          {deltaLabel}
        </span>
      </span>

      <div className="overlay-no-drag" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        <button
          type="button"
          className="overlay-icon-btn"
          onClick={onToggleControls}
          title="Opacidad y atajos"
          aria-expanded={controlsOpen}
          aria-label="Abrir controles de opacidad"
        >
          <SlidersHorizontal size={13} />
        </button>
        <button
          type="button"
          className="overlay-icon-btn"
          onClick={onExpand}
          title="Expandir HUD (Shift+F1)"
          aria-label="Expandir overlay"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
};
