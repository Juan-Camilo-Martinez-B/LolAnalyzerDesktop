import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import './overlay.css';
import { AppProvider } from '../context/AppContext';
import { OverlayHeader } from './components/OverlayHeader';
import { CsPacingWidget } from './components/CsPacingWidget';
import { ObjectiveTimersWidget } from './components/ObjectiveTimersWidget';
import { LiveTiltWarning } from './components/LiveTiltWarning';
import { MiniHudBar } from './components/MiniHudBar';
import { OverlayControls } from './components/OverlayControls';
import { useOverlay, useGameClock } from '../hooks/useGameState';
import { useUserSettings } from '../hooks/useUserSettings';
import { registerHotkeys, overwolfService } from '../services/overwolfService';
import { EventSimulatorBar } from '../components/debug/EventSimulatorBar';
import { audioService } from '../services/audioService';
import type { OverlayAnchor } from '../services/settingsStore';

function anchorStyle(anchor: OverlayAnchor): React.CSSProperties {
  if (anchor === 'top-center') {
    return { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)' };
  }
  if (anchor === 'bottom-left') {
    return { position: 'fixed', bottom: 24, left: 16 };
  }
  return { position: 'fixed', top: 16, left: 16 };
}

const OverlayApp: React.FC = () => {
  const { overlay, setMode, setVisible, setOpacity } = useOverlay();
  const { settings, update } = useUserSettings();
  const timeSec = useGameClock();
  const [showTiltAlert, setShowTiltAlert] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [hiddenTiltAt, setHiddenTiltAt] = useState<number | null>(null);

  useEffect(() => {
    setVisible(true);
    return registerHotkeys();
  }, [setVisible]);

  useEffect(() => {
    setOpacity(settings.overlayOpacity);
    audioService.applyPreferences(settings.audio);
  }, [setOpacity, settings.overlayOpacity, settings.audio]);

  const hudVisible = overlay.visible && overlay.mode !== 'hidden';

  const gameTime = timeSec > 0 ? timeSec : overlay.gameTime > 0 ? overlay.gameTime : 872;
  const csPerMin = overlay.csPerMin > 0 ? overlay.csPerMin : 7.8;
  const csDelta = overlay.csVsChallenger !== 0 ? overlay.csVsChallenger : -1.2;
  const tiltActive = overlay.tiltAlert
    ? overlay.tiltAlert.timestamp !== hiddenTiltAt
    : showTiltAlert;
  const tiltLabel = overlay.tiltAlert?.triggerReason ?? '2 muertes consecutivas en 3 minutos';
  const isExpanded = overlay.mode === 'expanded';
  const nativeWindow = overwolfService.isOverwolfAvailable();

  const changeOpacity = (opacity: number) => {
    setOpacity(opacity);
    update({ overlayOpacity: opacity });
  };

  return (
    <>
    {hudVisible && (
    <div
      style={{
        width: '100%',
        maxWidth: isExpanded ? '360px' : '340px',
        maxHeight: 'calc(100vh - 24px)',
        background: 'rgba(5, 8, 14, 0.90)',
        border: '1px solid var(--border-gold)',
        borderRadius: '10px',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 15px rgba(200, 155, 60, 0.2)',
        fontFamily: 'var(--font-body)',
        color: 'var(--slate-100)',
        opacity: overlay.opacity,
        pointerEvents: 'auto',
        transition: 'opacity 0.15s ease, max-width 0.2s ease',
        ...(nativeWindow ? { position: 'absolute', top: 12, left: 12 } : anchorStyle(settings.overlayAnchor)),
      }}
    >
      {isExpanded ? (
        <>
          <OverlayHeader gameTimeSec={gameTime} csPerMin={csPerMin} />
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tiltActive && (
              <LiveTiltWarning
                tiltIndex={overlay.tiltAlert?.tiltIndex}
                triggerReason={tiltLabel}
                adviceMessage={overlay.tiltAlert?.coachMessage}
                onDismiss={() => {
                  if (overlay.tiltAlert) setHiddenTiltAt(overlay.tiltAlert.timestamp);
                  setShowTiltAlert(false);
                }}
              />
            )}
            <CsPacingWidget gameTimeSec={gameTime} currentCs={Math.round(csPerMin * (gameTime / 60))} />
            <ObjectiveTimersWidget currentGameTimeSec={gameTime} />
          </div>
          <OverlayControls
            opacity={overlay.opacity}
            mode={overlay.mode}
            onOpacityChange={changeOpacity}
            onToggleMode={() => setMode('compact')}
            onHide={() => setVisible(false)}
          />
        </>
      ) : (
        <>
          <MiniHudBar
            gameTimeSec={gameTime}
            csPerMin={csPerMin}
            csDelta={csDelta}
            tiltActive={tiltActive}
            tiltLabel={tiltLabel}
            controlsOpen={controlsOpen}
            onExpand={() => setMode('expanded')}
            onToggleControls={() => setControlsOpen((open) => !open)}
          />
          {controlsOpen && (
            <OverlayControls
              opacity={overlay.opacity}
              mode={overlay.mode}
              onOpacityChange={changeOpacity}
              onToggleMode={() => setMode('expanded')}
              onHide={() => setVisible(false)}
            />
          )}
        </>
      )}
    </div>
    )}
    <EventSimulatorBar placement="float" />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <React.StrictMode>
    <AppProvider>
      <OverlayApp />
    </AppProvider>
  </React.StrictMode>
);
