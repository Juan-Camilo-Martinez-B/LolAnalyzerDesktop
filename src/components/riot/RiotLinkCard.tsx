import { useState } from 'react';
import { Card } from '../ui';
import { useAuth } from '../../context/AuthContext';

const REGIONS = ['la1', 'la2', 'na1', 'br1', 'euw1', 'eun1', 'kr', 'jp1', 'oc1', 'tr1'];

export function RiotLinkCard() {
  const auth = useAuth();
  const [gameName, setGameName] = useState(auth.user?.riotGameName ?? '');
  const [tagLine, setTagLine] = useState(auth.user?.riotTagLine ?? '');
  const [region, setRegion] = useState(auth.user?.region || 'la1');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      await auth.linkRiot(gameName.trim(), tagLine.trim(), region);
      setMessage('Cuenta de Riot vinculada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo vincular.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="gold" title="Cuenta de Riot" subtitle="Se usa la API oficial. No pedimos tu contraseña de Riot.">
      <div className="auth-form">
        <label>
          Nombre de Riot
          <input value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="Nombre" />
        </label>
        <label>
          Tag
          <input value={tagLine} onChange={(event) => setTagLine(event.target.value)} placeholder="LAN" />
        </label>
        <label>
          Región
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="auth-actions">
          <button type="button" onClick={() => void submit()} disabled={busy || !gameName || !tagLine}>
            {busy ? 'Vinculando…' : auth.user?.riotLinked ? 'Actualizar vínculo' : 'Vincular'}
          </button>
        </div>
        {message && <p className={message.includes('vinculada') ? 'auth-ok' : 'auth-error'}>{message}</p>}
      </div>
    </Card>
  );
}
