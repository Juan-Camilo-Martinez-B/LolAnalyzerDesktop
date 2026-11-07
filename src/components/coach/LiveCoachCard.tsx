import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Badge, Card } from '../ui';
import { apiRequest } from '../../services/backendAuth';
import { publishAppError } from '../../services/userErrors';
import { publishCoachToOverlay } from '../../services/overwolfService';
import './liveCoach.css';

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
  id?: number;
  text: string;
  severity: string;
  category?: string;
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

const SOURCE_LABELS: Record<string, string> = {
  rules: 'Lectura en vivo',
  groq: 'Groq',
  gemini: 'Gemini',
  heuristic: 'Motor local',
};

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
        const body = await apiRequest<LiveCoachState>('/api/coach/live');
        if (!cancelled) setState(body);
      } catch (error) {
        if (!cancelled) publishAppError(error);
      }
    };

    pull();
    const timer = window.setInterval(pull, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const liveAdvice = state?.in_game ? state.advice ?? null : null;
  const adviceKey = liveAdvice ? `${liveAdvice.id ?? ''}|${liveAdvice.text}` : '';

  // The overlay has no session of its own; this window relays each new tip to it.
  useEffect(() => {
    publishCoachToOverlay(liveAdvice ? {
      text: liveAdvice.text,
      severity: liveAdvice.severity,
      category: liveAdvice.category,
      at: Date.now(),
    } : null);
    // Only a new tip (id or text) is relayed; polls with the same tip are not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adviceKey]);

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
          <Badge variant={advice.source === 'heuristic' ? 'neutral' : 'gold'}>
            {SOURCE_LABELS[advice.source] ?? 'Motor local'}
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
