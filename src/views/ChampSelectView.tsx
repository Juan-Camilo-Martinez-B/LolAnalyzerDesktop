import React, { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';
import { Card } from '../components/ui';
import { useApp } from '../context/AppContext';
import { fetchLiveChampSelect } from '../services/champSelectClient';
import '../components/champ-select/champSelect.css';

export function ChampSelectView() {
  const { state, dispatch } = useApp();
  const [waiting, setWaiting] = useState(true);
  const session = state.champSelectSession;

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const live = await fetchLiveChampSelect();
        if (cancelled) return;
        dispatch({ type: 'SET_CHAMP_SELECT', payload: live });
      } catch {
        if (cancelled) return;
        dispatch({ type: 'SET_CHAMP_SELECT', payload: null });
      } finally {
        if (!cancelled) setWaiting(false);
      }
    };

    pull();
    const timer = window.setInterval(pull, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [dispatch]);

  const secondsLeft = Math.max(0, Math.ceil((session?.timer.adjustedTimeLeftInPhase ?? 0) / 1000));
  const phaseLabel = session?.timer.phase?.replace(/_/g, ' ') || 'Selección';

  return (
    <div className="page-view">
      <div className="cs-phase card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="cs-phase__lead">
          <Swords size={22} color="var(--hextech-gold)" />
          <div>
            <div className="cs-phase__title" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Selección de campeón
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {session ? `${phaseLabel} · ${secondsLeft}s` : 'Esperando al cliente de League'}
            </div>
          </div>
        </div>
      </div>

      {session ? (
        <TeamCompositionGrid
          myTeam={session.myTeam}
          theirTeam={session.theirTeam}
          bans={session.bans}
        />
      ) : (
        <Card className="cs-wait">
          <h2 className="cs-wait__title">{waiting ? 'Leyendo el cliente…' : 'Entra en cola'}</h2>
          <p className="cs-wait__copy">
            Abre League of Legends y entra a una partida. Esta pantalla muestra el draft. Si la partida ya empezó, el coach de arriba lee el juego en vivo.
          </p>
        </Card>
      )}
    </div>
  );
}
