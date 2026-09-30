import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ChampionOption } from '../../services/backendAuth';
import './auth.css';

type Mode = 'login' | 'register' | 'recover';
const REGIONS = ['la1', 'la2', 'na1', 'br1', 'euw1', 'eun1', 'kr', 'jp1', 'oc1', 'tr1'];

export function AuthGate() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [favorite, setFavorite] = useState('Ahri');
  const [firstMain, setFirstMain] = useState('Ahri');
  const [peakElo, setPeakElo] = useState('oro');
  const [region, setRegion] = useState('la1');
  const [step, setStep] = useState(1);
  const [champions, setChampions] = useState<ChampionOption[]>([{ id: 'Ahri', name: 'Ahri' }]);
  const [elos, setElos] = useState<string[]>(['hierro', 'bronce', 'plata', 'oro', 'platino', 'esmeralda', 'diamante', 'maestro', 'gran maestro', 'challenger']);

  useEffect(() => {
    if (mode === 'login') return;
    auth.loadRecoveryOptions()
      .then((options) => {
        if (options.champions.length > 0) {
          setChampions(options.champions);
          setFavorite(options.champions[0].name);
          setFirstMain(options.champions[0].name);
        }
        if (options.elos.length > 0) setElos(options.elos);
      })
      .catch(() => {
        auth.clearError();
      });
  }, [mode]);

  const submit = async () => {
    setBusy(true);
    setNotice('');
    try {
      if (mode === 'login') {
        await auth.signIn(email, password);
      } else if (mode === 'register') {
        if (step === 1) {
          setStep(2);
          return;
        }
        await auth.signUp({
          email,
          username,
          password,
          passwordConfirm,
          favoriteChampion: favorite,
          peakElo,
          firstMain,
          region,
        });
      } else if (step < 3) {
        setStep(step + 1);
      } else {
        await auth.recover({
          email,
          favoriteChampion: favorite,
          peakElo,
          firstMain,
          newPassword: password,
          newPasswordConfirm: passwordConfirm,
        });
        setMode('login');
        setStep(1);
        setPassword('');
        setPasswordConfirm('');
        setNotice('Contraseña actualizada. Entra con la nueva clave.');
      }
    } catch {
      // The message lives in auth.error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-card">
        <h1>{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Recuperar cuenta'}</h1>
        <p>
          {mode === 'login' && 'La sesión se guarda cifrada en este dispositivo.'}
          {mode === 'register' && (step === 1 ? 'Datos de la cuenta.' : 'Preguntas de recuperación. No se guardan en texto plano.')}
          {mode === 'recover' && (step === 1 ? 'Correo de la cuenta.' : step === 2 ? 'Responde las tres preguntas.' : 'Elige una contraseña nueva.')}
        </p>
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          {(mode !== 'recover' || step === 1 || step === 3) && (
            <label>
              Correo
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          )}
          {mode === 'register' && step === 1 && (
            <>
              <label>
                Usuario
                <input value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} required />
              </label>
              <label>
                Región
                <select value={region} onChange={(event) => setRegion(event.target.value)}>
                  {REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}
          {((mode === 'login') || (mode === 'register' && step === 1) || (mode === 'recover' && step === 3)) && (
            <label>
              {mode === 'recover' ? 'Nueva contraseña' : 'Contraseña'}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </label>
          )}
          {((mode === 'register' && step === 1) || (mode === 'recover' && step === 3)) && (
            <label>
              Confirmar contraseña
              <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} minLength={8} required />
            </label>
          )}
          {((mode === 'register' && step === 2) || (mode === 'recover' && step === 2)) && (
            <>
              <label>
                ¿Cuál es tu campeón favorito?
                <select value={favorite} onChange={(event) => setFavorite(event.target.value)}>
                  {champions.map((champion) => <option key={champion.id} value={champion.name}>{champion.name}</option>)}
                </select>
              </label>
              <label>
                ¿Cuál ha sido tu mayor Elo?
                <select value={peakElo} onChange={(event) => setPeakElo(event.target.value)}>
                  {elos.map((elo) => <option key={elo} value={elo}>{elo}</option>)}
                </select>
              </label>
              <label>
                ¿Cuál fue tu primer Main?
                <select value={firstMain} onChange={(event) => setFirstMain(event.target.value)}>
                  {champions.map((champion) => <option key={champion.id} value={champion.name}>{champion.name}</option>)}
                </select>
              </label>
            </>
          )}
          {auth.error && <div className="auth-error">{auth.error}</div>}
          {notice && <div className="auth-ok">{notice}</div>}
          <div className="auth-actions">
            <button type="submit" disabled={busy}>{busy ? 'Espera…' : 'Continuar'}</button>
            {mode !== 'login' && (
              <button type="button" className="auth-link" onClick={() => { setMode('login'); setStep(1); auth.clearError(); }}>
                Volver al login
              </button>
            )}
            {mode === 'login' && (
              <>
                <button type="button" className="auth-link" onClick={() => { setMode('register'); setStep(1); auth.clearError(); }}>
                  Registrarse
                </button>
                <button type="button" className="auth-link" onClick={() => { setMode('recover'); setStep(1); auth.clearError(); }}>
                  Olvidé mi contraseña
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
