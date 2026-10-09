import React, { useEffect, useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { apiRequest } from '../../services/backendAuth';
import { Badge, Card } from '../ui';
import './coachMetrics.css';

interface CoachTip {
  id: number;
  text: string;
  trigger: string;
  champion: string;
  role: string;
  gameTime: number;
  source: string;
  createdAt: string | null;
}

interface CoachMetrics {
  total: number;
  fromGemini: number;
  fromHeuristic: number;
  byTrigger: { trigger: string; count: number }[];
  recent: CoachTip[];
}

const TRIGGER_LABELS: Record<string, string> = {
  TILT_RISK: 'Riesgo de tilt',
  CS_CRASH: 'Farmeo',
  FORCED_FIGHT_NO_SUMMONERS: 'Pelea sin destello',
  OBJECTIVE_CONTEST_RISK: 'Objetivo',
  GENERAL_TACTICAL: 'Lectura general',
};

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

function when(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const CoachAnalyticsTab: React.FC = () => {
  const [metrics, setMetrics] = useState<CoachMetrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const pull = () => {
      apiRequest<CoachMetrics>('/api/coach/metrics')
        .then((body) => {
          if (active) {
            setMetrics(body);
            setError('');
          }
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas.');
        });
    };
    pull();
    const timer = window.setInterval(pull, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const total = metrics?.total ?? 0;

  return (
    <div className="coach-metrics">
      <div className="coach-metrics__grid">
        <Card variant="gold">
          <div className="coach-metrics__label"><Bot size={16} /> Consejos guardados</div>
          <div className="coach-metrics__value">{total}</div>
          <p className="coach-metrics__note">
            Quedan en tu cuenta. Al volver a entrar siguen aquí.
          </p>
        </Card>
        <Card variant="cyan">
          <div className="coach-metrics__label"><Sparkles size={16} /> Origen</div>
          <p className="coach-metrics__note">
            Gemini: <strong>{metrics?.fromGemini ?? 0}</strong>
            {' · '}
            Motor local: <strong>{metrics?.fromHeuristic ?? 0}</strong>
          </p>
        </Card>
      </div>

      <Card>
        <div className="coach-metrics__label">Por tipo de aviso</div>
        {total === 0 ? (
          <p className="coach-metrics__note">Entra a una partida para que el coach empiece a guardar consejos.</p>
        ) : (
          <ul className="coach-metrics__triggers">
            {metrics?.byTrigger.map((item) => (
              <li key={item.trigger}>
                <span>{TRIGGER_LABELS[item.trigger] ?? item.trigger}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="coach-metrics__note">{error}</p>}
      </Card>

      <Card>
        <div className="coach-metrics__label">Últimos consejos</div>
        {total === 0 ? (
          <p className="coach-metrics__note">Todavía no hay consejos en esta cuenta.</p>
        ) : (
          <ul className="coach-metrics__list">
            {metrics?.recent.map((tip) => (
              <li key={tip.id}>
                <div className="coach-metrics__tip-head">
                  <strong>{tip.champion} · {tip.role} · {clock(tip.gameTime)}</strong>
                  <Badge variant={tip.source === 'gemini' ? 'gold' : 'neutral'}>
                    {tip.source === 'gemini' ? 'Gemini' : 'Motor local'}
                  </Badge>
                </div>
                <p>{tip.text}</p>
                <span>{TRIGGER_LABELS[tip.trigger] ?? tip.trigger}{tip.createdAt ? ` · ${when(tip.createdAt)}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
