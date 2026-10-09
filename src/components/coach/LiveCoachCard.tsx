import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Badge, Card } from '../ui';
import './liveCoach.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface LivePlayer {
  champion: string;
  role: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  level: number;
  gameTime: number;
}

interface LiveAdvice {
  text: string;
  severity: string;
  champion: string;
  role: string;
  gameTime: number;
  source: string;
}

interface LiveCoachState {
  in_game: boolean;
  waiting: boolean;
  player: LivePlayer | null;
  advice: LiveAdvice | null;
}

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function LiveCoachCard() {
  const [state, setState] = useState<LiveCoachState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/coach/live`, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) return;
        const body = await response.json() as LiveCoachState;
        if (!cancelled) setState(body);
      } catch {
        if (!cancelled) setState(null);
      }
    };

    pull();
    const timer = window.setInterval(pull, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const inGame = Boolean(state?.in_game);
  const advice = state?.advice;
  const player = state?.player;
  const title = inGame ? 'Coach en partida' : 'Coach en espera';
  const detail = player
    ? `${player.champion} · ${player.role} · ${player.kills}/${player.deaths}/${player.assists} · ${player.cs} CS · ${clock(player.gameTime)}`
    : inGame
      ? 'El cliente está en partida. Esperando los datos del juego.'
      : 'Entra a una partida y el coach leerá el juego en vivo.';

  return (
    <Card variant={inGame ? 'gold' : 'flat'} className="live-coach">
      <div className="live-coach__head">
        <Sparkles size={16} color="var(--hextech-gold)" />
        <strong>{title}</strong>
        {advice && (
          <Badge variant={advice.source === 'gemini' ? 'gold' : 'neutral'}>
            {advice.source === 'gemini' ? 'Gemini' : 'Motor local'}
          </Badge>
        )}
      </div>
      <p className="live-coach__detail">{detail}</p>
      <p className="live-coach__text">
        {advice?.text ?? (inGame ? 'Preparando el primer consejo…' : 'Sin consejo todavía.')}
      </p>
    </Card>
  );
}
