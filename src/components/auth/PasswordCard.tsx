import { useState } from 'react';
import { Card } from '../ui';
import { useAuth } from '../../context/AuthContext';

export function PasswordCard() {
  const auth = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    if (nextPassword.length < 8) {
      setMessage('La nueva contraseña necesita al menos 8 caracteres.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      setMessage('La confirmación no coincide.');
      return;
    }
    setBusy(true);
    try {
      await auth.updatePassword(currentPassword, nextPassword);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
      setBusy(false);
    }
  };

  return (
    <Card variant="flat" title="Contraseña" subtitle="Al cambiarla se cierra la sesión en este equipo.">
      <div className="auth-form">
        <label>
          Contraseña actual
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
        </label>
        <label>
          Nueva contraseña
          <input type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Confirmar contraseña
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" />
        </label>
        <div className="auth-actions">
          <button type="button" onClick={() => void submit()} disabled={busy || !currentPassword || !nextPassword}>
            {busy ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
        {message && <p className="auth-error">{message}</p>}
      </div>
    </Card>
  );
}
