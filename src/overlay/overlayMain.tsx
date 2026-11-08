import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import './overlay.css';
import { AppProvider } from '../context/AppContext';
import { CsPacingWidget } from './components/CsPacingWidget';
import { LiveTiltWarning } from './components/LiveTiltWarning';
import { LiveHudPanel } from './components/LiveHudPanel';
import { OverlayControls } from './components/OverlayControls';
import { useOverlay, useGameClock } from '../hooks/useGameState';
import { useUserSettings } from '../hooks/useUserSettings';
import { isElectronApp, registerHotkeys, toggleOverlay } from '../services/overwolfService';
import { audioService } from '../services/audioService';
import { deathsBeforeTiltAlert, type OverlayAnchor } from '../services/settingsStore';
import { simulatorTiltIndex } from '../services/tiltCalculations';
import { ThemeRoot } from '../components/theme/ThemeRoot';
import { csTargetForPosition, readTilt } from './hudMetrics';
import { useOverlayLive } from './useOverlayLive';
import { useDraggablePanel } from './useDraggablePanel';
import { useHotkeys } from '../hooks/useHotkeys';
import { formatShortcut } from '../services/hotkeyFormat';

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
  const clockSec = useGameClock();
  const live = useOverlayLive();
  const { panelRef, style: dragStyle, dragging, handleProps, reset } = useDraggablePanel(live.editMode);
  const electron = isElectronApp();
  const [{ config: hotkeys }] = useHotkeys();

  useEffect(() => {
    setVisible(true);
    return registerHotkeys();
  }, [setVisible]);

  useEffect(() => {
    setOpacity(settings.overlayOpacity);
    audioService.applyPreferences(settings.audio);
  }, [setOpacity, settings.overlayOpacity, settings.audio]);

  if (!overlay.visible || overlay.mode === 'hidden') return null;

  const gameTime = live.stats?.gameTime ?? clockSec;
  const tilt = readTilt(live.deathTimes, gameTime, deathsBeforeTiltAlert(settings.coachSensitivity));
  const expanded = overlay.mode === 'expanded';
  const csTarget = csTargetForPosition(live.stats?.position);

  const changeOpacity = (opacity: number) => {
    setOpacity(opacity);
    update({ overlayOpacity: opacity });
  };

  const hide = () => {
    if (electron) void toggleOverlay();
    else setVisible(false);
  };

  return (
    <div
      ref={panelRef}
      className={`hud-panel ${live.editMode && electron ? 'is-editing' : ''} ${dragging ? 'is-dragging' : ''}`}
      style={{
        maxWidth: expanded ? 360 : 320,
        opacity: overlay.opacity,
        ...(dragStyle ?? anchorStyle(settings.overlayAnchor)),
      }}
      {...handleProps}
    >
      <LiveHudPanel
        stats={live.stats}
        gameTimeSec={gameTime}
        tilt={tilt}
        advice={live.advice}
        expanded={expanded}
        editMode={live.editMode && electron}
        onToggleExpanded={() => setMode(expanded ? 'compact' : 'expanded')}
        cycleShortcut={formatShortcut(hotkeys.cycleMode)}
      />

      {expanded && live.stats && (
        <div className="hud-expanded">
          {tilt.active && (
            <LiveTiltWarning
              tiltIndex={simulatorTiltIndex(tilt.recentDeaths)}
              triggerReason={tilt.label}
              adviceMessage={live.advice?.text ?? 'Juega seguro unos minutos: farmea con visión y espera a tu equipo.'}
            />
          )}
          {csTarget != null && (
            <CsPacingWidget
              currentCs={live.stats.creepScore}
              gameTimeSec={live.stats.gameTime}
              targetCsPerMin={csTarget}
            />
          )}
        </div>
      )}

      {live.editMode && electron && (
        <>
          <p className="hud-edit-hint">Arrastra el panel. Pulsa {formatShortcut(hotkeys.toggleEditMode)} para fijarlo y volver al juego.</p>
          <OverlayControls
            opacity={overlay.opacity}
            onOpacityChange={changeOpacity}
            onResetPosition={reset}
            onHide={hide}
            editShortcut={formatShortcut(hotkeys.toggleEditMode)}
            hideShortcut={formatShortcut(hotkeys.toggleOverlay)}
          />
        </>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <React.StrictMode>
    <AppProvider>
      <ThemeRoot />
      <OverlayApp />
    </AppProvider>
  </React.StrictMode>
);
