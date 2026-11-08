import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, Card } from '../ui';
import { AnalysisContent } from '../coach/AnalysisContent';
import type { MatchAnalysis } from '../../services/analysisClient';
import { fetchAnalysisReports, reportDate } from '../../services/reportsClient';
import { eventBus } from '../../services/eventBus';
import './reports.css';

/** Every post-match report of the account; one opens at a time. */
export function PostGameReports() {
  const [reports, setReports] = useState<MatchAnalysis[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchAnalysisReports()
        .then((rows) => {
          if (!active) return;
          setReports(rows);
          setError('');
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los informes.');
        });
    };
    load();
    // A game analysed after the match shows up without reopening the view.
    const stop = eventBus.on('history:updated', load);
    return () => {
      active = false;
      stop();
    };
  }, []);

  return (
    <Card title="Informes post-partida" subtitle="Un análisis por partida, redactado al terminarla. Se guardan en tu cuenta.">
      {error && <p className="reports__note reports__note--error">{error}</p>}
      {reports === null && !error && <p className="reports__note">Cargando informes…</p>}
      {reports?.length === 0 && (
        <p className="reports__note">
          Todavía no hay informes. Se crean solos al terminar una partida, o desde el detalle de una partida en el Dashboard.
        </p>
      )}
      <ul className="reports__list">
        {reports?.map((report) => {
          const isOpen = open === report.matchId;
          return (
            <li key={report.matchId} className="reports__item">
              <button
                type="button"
                className="reports__row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : report.matchId)}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <strong>{report.championName}</strong>
                <span className="reports__meta">{report.role}</span>
                <Badge variant={report.win ? 'cyan' : 'neutral'}>{report.win ? 'Victoria' : 'Derrota'}</Badge>
                <span className="reports__meta reports__meta--end">
                  {reportDate(report.createdAt)} · {report.source === 'groq' ? 'IA (Groq)' : 'Reglas'}
                </span>
              </button>
              {isOpen && (
                <div className="reports__body">
                  <AnalysisContent analysis={report} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
