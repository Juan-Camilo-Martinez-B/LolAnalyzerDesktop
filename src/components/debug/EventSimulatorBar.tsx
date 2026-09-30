import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useGamePhase, useGameClock } from '../../hooks/useGameState';
import { overwolfService } from '../../services/overwolfService';
import { audioService } from '../../services/audioService';
import {
  advanceSimulatorClock,
  isSimulatorRunning,
  resetSimulator,
  simulateClearTilt,
  simulateCoachAdvice,
  simulateCsTick,
  simulateDeath,
  simulateKill,
  simulateMatchEnd,
  simulatePhase,
  simulateTiltPing,
  startSimulator,
  stopSimulator,
} from '../../services/simulatorService';
import './eventSimulator.css';

export interface EventSimulatorBarProps {
  /** `dock` sits in the desktop shell. `float` stays on the overlay page. */
  placement?: 'dock' | 'float';
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** Manual match controls for browser testing, hidden inside the Overwolf client. */
export function EventSimulatorBar({ placement = 'dock' }: EventSimulatorBarProps) {
  const { setActiveTab } = useApp();
  const { phase } = useGamePhase();
  const timeSec = useGameClock();
  const [running, setRunning] = useState(isSimulatorRunning);
  const [note, setNote] = useState('listo');

  if (overwolfService.isOverwolfAvailable()) return null;

  const mark = (label: string) => {
    setNote(label);
    audioService.playClick();
  };

  return (
    <div className={`sim-bar ${placement === 'float' ? 'sim-bar--float' : ''}`} role="region" aria-label="Simulador de partida">
      <span className="sim-bar__label">SIM</span>
      <span className="sim-bar__status">
        {phase} · {formatClock(timeSec)} · {note}
      </span>
      <div className="sim-bar__actions">
        <button type="button" onClick={() => { simulatePhase('LOBBY'); mark('lobby'); }}>
          Lobby
        </button>
        <button
          type="button"
          onClick={() => {
            simulatePhase('CHAMP_SELECT');
            if (placement === 'dock') setActiveTab('champ-select');
            mark('selección');
          }}
        >
          Selección
        </button>
        <button type="button" onClick={() => { simulatePhase('IN_GAME'); mark('en juego'); }}>
          En juego
        </button>
        <button type="button" onClick={() => { advanceSimulatorClock(15); mark('+15s'); }}>
          +15s
        </button>
        <button type="button" onClick={() => { const cs = simulateCsTick(); mark(`${cs} CS`); }}>
          CS
        </button>
        <button type="button" onClick={() => { simulateKill(); mark('kill'); }}>
          Kill
        </button>
        <button type="button" className="is-danger" onClick={() => { const deaths = simulateDeath(); mark(`${deaths} muerte${deaths === 1 ? '' : 's'}`); }}>
          Muerte
        </button>
        <button type="button" className="is-danger" onClick={() => { simulateTiltPing(); mark('tilt'); }}>
          Tilt
        </button>
        <button type="button" onClick={() => { simulateClearTilt(); mark('tilt limpio'); }}>
          Calma
        </button>
        <button type="button" onClick={() => { simulateCoachAdvice(); mark('consejo'); }}>
          Consejo
        </button>
        <button type="button" className="is-win" onClick={() => { simulateMatchEnd(true); setRunning(false); mark('victoria'); }}>
          Victoria
        </button>
        <button type="button" className="is-danger" onClick={() => { simulateMatchEnd(false); setRunning(false); mark('derrota'); }}>
          Derrota
        </button>
        <button
          type="button"
          className={running ? 'is-live' : ''}
          onClick={() => {
            if (isSimulatorRunning()) {
              stopSimulator();
              setRunning(false);
              mark('auto off');
            } else {
              startSimulator();
              setRunning(true);
              mark('auto on');
            }
          }}
        >
          {running ? 'Detener auto' : 'Auto 40s'}
        </button>
        <button type="button" onClick={() => { resetSimulator(); setRunning(false); mark('reset'); }}>
          Reset
        </button>
      </div>
    </div>
  );
}
