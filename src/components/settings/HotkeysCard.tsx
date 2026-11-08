import { useEffect, useState } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import { Card } from '../ui';
import { useHotkeys } from '../../hooks/useHotkeys';
import { captureShortcut, formatShortcut } from '../../services/hotkeyFormat';
import {
  DEFAULT_HOTKEYS,
  isElectronApp,
  saveHotkeys,
  suspendHotkeys,
  type HotkeyAction,
  type HotkeyConfig,
} from '../../services/overwolfService';

const ACTIONS: { id: HotkeyAction; label: string; hint: string }[] = [
  { id: 'toggleEditMode', label: 'Mover o fijar el overlay', hint: 'Desbloquea el panel para arrastrarlo con el mouse.' },
  { id: 'toggleOverlay', label: 'Mostrar u ocultar', hint: 'Esconde el overlay sin cerrar la app.' },
  { id: 'cycleMode', label: 'Compacto o expandido', hint: 'Cambia el tamaño del panel en partida.' },
];

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

/**
 * Lets the player pick the overlay shortcuts. Main validates and registers them;
 * if Windows or League already uses a combination, the previous one stays.
 */
export function HotkeysCard() {
  const [{ config, inactive }, setHotkeyStatus] = useHotkeys();
  const [recording, setRecording] = useState<HotkeyAction | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const available = isElectronApp();

  const persist = async (next: HotkeyConfig, done: string) => {
    setStatus({ kind: 'saving' });
    const result = await saveHotkeys(next);
    setHotkeyStatus({ config: result.config, inactive: result.inactive });
    setStatus(result.ok ? { kind: 'ok', text: done } : { kind: 'error', text: result.error ?? 'No se pudo guardar el atajo.' });
  };

  // Windows swallows a registered shortcut before the window sees it, so they
  // are released while a new combination is recorded.
  useEffect(() => {
    if (!recording || !available) return;
    void suspendHotkeys(true);
    return () => {
      void suspendHotkeys(false);
    };
  }, [recording, available]);

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const capture = captureShortcut(event);
      if (capture.kind === 'pending') return;
      if (capture.kind === 'cancel') {
        setRecording(null);
        setStatus({ kind: 'idle' });
        return;
      }
      if (capture.kind === 'invalid') {
        setStatus({ kind: 'error', text: capture.message });
        return;
      }
      const action = recording;
      setRecording(null);
      void persist({ ...config, [action]: capture.accelerator }, `Atajo guardado: ${formatShortcut(capture.accelerator)}.`);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
    // persist only reads the latest config through this effect's closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, config]);

  return (
    <Card variant="flat" title="Atajos del overlay" subtitle="Combinaciones globales que funcionan dentro de League. Deben incluir Ctrl o Alt.">
      {!available && (
        <p className="settings-note">Los atajos se cambian desde la app de escritorio (Electron).</p>
      )}
      <div className="hotkey-list">
        {ACTIONS.map((action) => {
          const isRecording = recording === action.id;
          const taken = inactive.includes(action.id);
          return (
            <div key={action.id} className="settings-row">
              <div>
                <strong style={{ fontSize: '0.8rem' }}>{action.label}</strong>
                <p>{action.hint}</p>
                {taken && (
                  <p className="settings-note settings-note--error">
                    Otro programa usa {formatShortcut(config[action.id])}; este atajo no funciona. Elige otra combinación.
                  </p>
                )}
              </div>
              <button
                type="button"
                className={`hotkey-chip ${isRecording ? 'is-recording' : ''} ${taken ? 'is-taken' : ''}`}
                disabled={!available || status.kind === 'saving'}
                aria-label={`Cambiar atajo: ${action.label}`}
                onClick={() => {
                  setStatus({ kind: 'idle' });
                  setRecording(isRecording ? null : action.id);
                }}
              >
                <Keyboard size={12} />
                {isRecording ? 'Pulsa la combinación…' : formatShortcut(config[action.id])}
              </button>
            </div>
          );
        })}
      </div>
      <p className="settings-note">
        Funcionan en cualquier momento, pero el overlay solo aparece durante una partida: pruébalos dentro del juego.
      </p>
      {recording && <p className="settings-note">Pulsa Ctrl o Alt con una letra, un número o F1–F12. Esc cancela.</p>}
      {status.kind === 'ok' && <p className="settings-note settings-note--ok">{status.text}</p>}
      {status.kind === 'error' && <p className="settings-note settings-note--error">{status.text}</p>}
      <div className="settings-actions">
        <button
          type="button"
          disabled={!available || status.kind === 'saving'}
          onClick={() => void persist(DEFAULT_HOTKEYS, 'Atajos predeterminados restaurados.')}
        >
          <RotateCcw size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Restablecer
        </button>
      </div>
    </Card>
  );
}
