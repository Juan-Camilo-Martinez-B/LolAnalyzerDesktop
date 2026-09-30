import React from 'react';
import { EyeOff, Keyboard } from 'lucide-react';
import type { OverlayState } from '../../types/coach';

export interface OverlayControlsProps {
  opacity: number;
  mode: OverlayState['mode'];
  onOpacityChange: (opacity: number) => void;
  onToggleMode: () => void;
  onHide: () => void;
}

/** Opacity slider and hotkey legend. Does not cover the game HUD by itself. */
export const OverlayControls: React.FC<OverlayControlsProps> = ({
  opacity,
  mode,
  onOpacityChange,
  onToggleMode,
  onHide,
}) => {
  const percent = Math.round(opacity * 100);
  const compact = mode !== 'expanded';

  return (
    <div className="overlay-controls overlay-no-drag">
      <div className="overlay-controls-row">
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--slate-300)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Opacidad {percent}%
        </span>
        <input
          className="overlay-opacity-slider"
          type="range"
          min={35}
          max={100}
          step={1}
          value={percent}
          aria-label="Opacidad del overlay"
          onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
        />
      </div>

      <div className="overlay-controls-row">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--slate-400)', fontSize: '0.65rem' }}>
          <Keyboard size={12} color="var(--gold-500)" />
          <span className="overlay-hotkey">Ctrl+Tab</span>
          ocultar
          <span className="overlay-hotkey">Shift+F1</span>
          {compact ? 'expandir' : 'compacto'}
        </span>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <button type="button" className="overlay-text-btn" onClick={onToggleMode}>
            {compact ? 'Expandir' : 'Mini-HUD'}
          </button>
          <button type="button" className="overlay-text-btn" onClick={onHide} title="Ocultar overlay (Ctrl+Tab)">
            <EyeOff size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Ocultar
          </button>
        </span>
      </div>
    </div>
  );
};
