import React from 'react';
import { EyeOff, Keyboard, RotateCcw } from 'lucide-react';

export interface OverlayControlsProps {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onResetPosition: () => void;
  onHide: () => void;
}

/** Shown only while the HUD is unlocked: opacity, position reset and the hotkey legend. */
export const OverlayControls: React.FC<OverlayControlsProps> = ({
  opacity,
  onOpacityChange,
  onResetPosition,
  onHide,
}) => {
  const percent = Math.round(opacity * 100);

  return (
    <div className="overlay-controls">
      <div className="overlay-controls-row">
        <span className="overlay-controls-label">Opacidad {percent}%</span>
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
        <span className="overlay-controls-keys">
          <Keyboard size={12} color="var(--gold-500)" />
          <span className="overlay-hotkey">Ctrl+Shift+L</span> fijar
          <span className="overlay-hotkey">Ctrl+Shift+O</span> ocultar
        </span>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <button type="button" className="overlay-text-btn" onClick={onResetPosition} title="Volver a la esquina de Ajustes">
            <RotateCcw size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Posición
          </button>
          <button type="button" className="overlay-text-btn" onClick={onHide} title="Ocultar overlay (Ctrl+Shift+O)">
            <EyeOff size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Ocultar
          </button>
        </span>
      </div>
    </div>
  );
};
