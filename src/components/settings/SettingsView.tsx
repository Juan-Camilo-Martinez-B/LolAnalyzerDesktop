import { useState, useEffect } from 'react';
import { Activity, AudioLines, Brain, Crosshair, RefreshCw } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectionStatus, useGamePhase, useSummoner } from '../../hooks/useGameState';
import { useUserSettings } from '../../hooks/useUserSettings';
import { audioService } from '../../services/audioService';
import { checkBackendHealth } from '../../services/apiClient';
import { getLcuDiagnostics, reprobeLcu } from '../../services/lcuService';
import { placeOverlay } from '../../services/overwolfService';
import { deathsBeforeTiltAlert, type CoachSensitivity, type OverlayAnchor, type ThemePreference } from '../../services/settingsStore';
import type { ConnectionStatus } from '../../types/game';
import { PasswordCard } from '../auth/PasswordCard';
import { RiotLinkCard } from '../riot/RiotLinkCard';
import '../auth/auth.css';
import './settings.css';

const SENSITIVITY: { id: CoachSensitivity; label: string; hint: string }[] = [
  { id: 'low', label: 'Baja', hint: 'Solo tras 3 muertes' },
  { id: 'balanced', label: 'Equilibrada', hint: 'Tras 2 muertes seguidas' },
  { id: 'high', label: 'Alta', hint: 'Avisa en la primera muerte' },
];

const THEMES: { id: ThemePreference; label: string; hint: string; preview: string }[] = [
  { id: 'light', label: 'Claro', hint: 'Pergamino opaco', preview: 'light' },
  { id: 'system', label: 'Sistema', hint: 'Sigue al equipo', preview: 'system' },
  { id: 'dark', label: 'Oscuro', hint: 'Hextech nocturno', preview: 'dark' },
];

const ANCHORS: { id: OverlayAnchor; label: string; hint: string }[] = [
  { id: 'top-left', label: 'Superior izquierda', hint: 'Bajo los retratos aliados' },
  { id: 'top-center', label: 'Superior centro', hint: 'Sobre el río, fuera del marcador' },
  { id: 'bottom-left', label: 'Inferior izquierda', hint: 'Lejos del minimapa y las habilidades' },
];

function statusVariant(status: ConnectionStatus): 'win' | 'loss' | 'gold' {
  if (status === 'connected') return 'win';
  if (status === 'error') return 'loss';
  return 'gold';
}

function statusLabel(status: ConnectionStatus): string {
  if (status === 'connected') return 'Conectado';
  if (status === 'error') return 'Error';
  if (status === 'reconnecting') return 'Reconectando';
  return 'Sin conexión';
}

function Switch({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="settings-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
    >
      <i />
    </button>
  );
}

export function SettingsView() {
  const { dispatch } = useApp();
  const auth = useAuth();
  const { settings, update } = useUserSettings();
  const { lcu, backend } = useConnectionStatus();
  const { phase } = useGamePhase();
  const { summoner } = useSummoner();
  const [diag, setDiag] = useState(getLcuDiagnostics);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    audioService.applyPreferences(settings.audio);
  }, [settings.audio]);

  const percent = Math.round(settings.overlayOpacity * 100);
  const soundBlocked = settings.audio.muted;

  const applyAudio = (next = settings.audio) => {
    audioService.applyPreferences(next);
  };

  const retryDiagnostics = async () => {
    setChecking(true);
    try {
      const backendOk = await checkBackendHealth();
      dispatch({ type: 'SET_BACKEND_STATUS', payload: backendOk ? 'connected' : 'disconnected' });
      const lcuOk = await reprobeLcu();
      if (lcuOk) {
        dispatch({ type: 'SET_LCU_STATUS', payload: 'connected' });
      } else if (getLcuDiagnostics().hasCredentials) {
        dispatch({ type: 'SET_LCU_STATUS', payload: 'error' });
      }
      setDiag(getLcuDiagnostics());
      setLastCheck(new Date().toLocaleTimeString());
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Ajustes</h1>
        <p>
          Sensibilidad del coach, anclaje HUD-safe del overlay, alertas de audio y estado del cliente de League.
        </p>
      </header>

      <div className="settings-grid">
        <Card variant="gold" title="Apariencia" subtitle="El claro es el predeterminado. Las superficies se quedan opacas para no fatigar la vista.">
          <div className="theme-picker" role="group" aria-label="Tema de la aplicación">
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`theme-swatch theme-swatch--${option.preview}`}
                aria-pressed={settings.theme === option.id}
                onClick={() => {
                  update({ theme: option.id });
                  audioService.playClick();
                  if (auth.status === 'authenticated') {
                    void auth.saveTheme(option.id);
                  }
                }}
              >
                <span className="theme-swatch__preview" aria-hidden="true">
                  <i className="theme-swatch__rail" />
                  <b />
                </span>
                <span className="theme-swatch__copy">
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
        <RiotLinkCard />
        <PasswordCard />
        <Card variant="flat" title="Sensibilidad del coach" subtitle="Cuándo el overlay emite una alerta de tilt">
          <div className="settings-segment" role="group" aria-label="Sensibilidad del coach">
            {SENSITIVITY.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={settings.coachSensitivity === option.id}
                onClick={() => {
                  update({ coachSensitivity: option.id });
                  audioService.playClick();
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
          <p className="settings-note">
            <Brain size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Umbral actual: {deathsBeforeTiltAlert(settings.coachSensitivity)} muerte
            {deathsBeforeTiltAlert(settings.coachSensitivity) === 1 ? '' : 's'} en la partida antes de pulsar la alerta.
          </p>
        </Card>

        <Card variant="flat" title="Posición del overlay" subtitle="Zonas que no tapan minimapa, habilidades ni el marcador">
          <div className="settings-segment" role="group" aria-label="Posición del overlay">
            {ANCHORS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={settings.overlayAnchor === option.id}
                onClick={() => {
                  update({ overlayAnchor: option.id });
                  void placeOverlay(option.id);
                  audioService.playClick();
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
          <div className="settings-row" style={{ marginTop: 12 }}>
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Opacidad {percent}%</strong>
              <p>Se aplica al Mini-HUD y al panel expandido.</p>
            </div>
          </div>
          <input
            className="settings-slider"
            type="range"
            min={35}
            max={100}
            step={1}
            value={percent}
            aria-label="Opacidad del overlay"
            onChange={(event) => update({ overlayOpacity: Number(event.target.value) / 100 })}
          />
          <p className="settings-note">
            <Crosshair size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Superior derecha y el centro inferior quedan bloqueados: ahí viven el KDA y la barra de habilidades.
          </p>
        </Card>

        <Card variant="flat" title="Alertas de audio" subtitle="Cues suaves para tilt, objetivos y clics de la interfaz">
          <div className="settings-row">
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Silencio general</strong>
              <p>Apaga todo el audio del coach.</p>
            </div>
            <Switch
              checked={settings.audio.muted}
              label="Silencio general"
              onClick={() => {
                const next = { ...settings.audio, muted: !settings.audio.muted };
                update({ audio: next });
                audioService.applyPreferences(next);
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Alerta de tilt</strong>
              <p>Pulso grave cuando salta el banner.</p>
            </div>
            <Switch
              checked={settings.audio.tiltAlerts}
              label="Alerta de tilt"
              onClick={() => {
                const next = { ...settings.audio, tiltAlerts: !settings.audio.tiltAlerts };
                update({ audio: next });
                applyAudio(next);
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Objetivos</strong>
              <p>Aviso de dragón, barón y larvas.</p>
            </div>
            <Switch
              checked={settings.audio.objectiveAlerts}
              label="Alertas de objetivos"
              onClick={() => {
                const next = { ...settings.audio, objectiveAlerts: !settings.audio.objectiveAlerts };
                update({ audio: next });
                applyAudio(next);
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Clics de interfaz</strong>
              <p>Feedback al pulsar controles del HUD.</p>
            </div>
            <Switch
              checked={settings.audio.uiClicks}
              label="Clics de interfaz"
              onClick={() => {
                const next = { ...settings.audio, uiClicks: !settings.audio.uiClicks };
                update({ audio: next });
                applyAudio(next);
              }}
            />
          </div>
          <div className="settings-actions">
            <button
              type="button"
              disabled={soundBlocked || !settings.audio.tiltAlerts}
              onClick={() => audioService.playWarning()}
            >
              <AudioLines size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Probar tilt
            </button>
            <button
              type="button"
              disabled={soundBlocked || !settings.audio.objectiveAlerts}
              onClick={() => audioService.playHextechAlert()}
            >
              Probar objetivo
            </button>
          </div>
        </Card>

        <Card variant="flat" title="Diagnóstico LCU" subtitle="Cliente de Riot, backend y fase de partida">
          <div className="settings-diag">
            <div className="settings-diag-item">
              <span>LCU</span>
              <strong><Badge variant={statusVariant(lcu)}>{statusLabel(lcu)}</Badge></strong>
            </div>
            <div className="settings-diag-item">
              <span>Backend</span>
              <strong><Badge variant={statusVariant(backend)}>{statusLabel(backend)}</Badge></strong>
            </div>
            <div className="settings-diag-item">
              <span>Fase</span>
              <strong>{phase}</strong>
            </div>
            <div className="settings-diag-item">
              <span>Puerto LCU</span>
              <strong>{diag.port ?? '—'}</strong>
            </div>
          </div>
          <p className="settings-note">
            <Activity size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Credenciales: {diag.hasCredentials ? 'lockfile leído' : 'aún no descubiertas en esta ventana'}.
            Polling: {diag.polling ? 'activo' : 'inactivo'}.
            {summoner ? ` Invocador: ${summoner.displayName}.` : ''}
            {lastCheck ? ` Última sonda: ${lastCheck}.` : ''}
          </p>
          <div className="settings-actions">
            <button type="button" onClick={() => void retryDiagnostics()} disabled={checking}>
              <RefreshCw size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {checking ? 'Sondeando…' : 'Reintentar sonda'}
            </button>
          </div>
          <p className="settings-note">
            En el navegador el lockfile lo lee la ventana background. Si el puerto aparece vacío, el cliente de League no está abierto o esta página no es el proceso que hace polling.
          </p>
        </Card>
      </div>
    </div>
  );
}
