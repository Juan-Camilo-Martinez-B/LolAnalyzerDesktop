import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { AppProvider } from '../context/AppContext';
import { OverlayHeader } from './components/OverlayHeader';
import { CsPacingWidget } from './components/CsPacingWidget';
import { ObjectiveTimersWidget } from './components/ObjectiveTimersWidget';
import { LiveTiltWarning } from './components/LiveTiltWarning';
import { useOverlay, useGamePhase } from '../hooks/useGameState';

const OverlayApp: React.FC = () => {
  const { overlay } = useOverlay();
  const { timeSec } = useGamePhase();
  const [showTiltAlert, setShowTiltAlert] = useState(true);

  if (!overlay.visible) return null;

  const isExpanded = overlay.mode === 'expanded';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '360px',
        background: 'rgba(5, 8, 14, 0.90)',
        border: '1px solid var(--border-gold)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 15px rgba(200, 155, 60, 0.2)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-primary)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Top HUD Drag Header */}
      <OverlayHeader gameTimeSec={timeSec > 0 ? timeSec : 872} csPerMin={7.8} />

      {/* Expanded Mode Widgets Container */}
      {isExpanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Live Tilt Warning (if triggered) */}
          {showTiltAlert && (
            <LiveTiltWarning onDismiss={() => setShowTiltAlert(false)} />
          )}

          {/* CS Pacing Tracker */}
          <CsPacingWidget gameTimeSec={timeSec > 0 ? timeSec : 872} currentCs={118} />

          {/* Objective Timers */}
          <ObjectiveTimersWidget currentGameTimeSec={timeSec > 0 ? timeSec : 872} />
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <React.StrictMode>
    <AppProvider>
      <OverlayApp />
    </AppProvider>
  </React.StrictMode>
);
