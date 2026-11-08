import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Card } from '../ui';
import { fetchMatchupReports, laneLabel, reportDate, type MatchupReport } from '../../services/reportsClient';
import './reports.css';

/** Lane plans received in champion select, newest first. */
export function MatchupReports() {
  const [reports, setReports] = useState<MatchupReport[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchMatchupReports()
      .then((rows) => {
        if (active) setReports(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los planes.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card title="Planes de matchup" subtitle="El plan de línea que recibiste en cada selección de campeón contra un rival conocido.">
      {error && <p className="reports__note reports__note--error">{error}</p>}
      {reports === null && !error && <p className="reports__note">Cargando planes…</p>}
      {reports?.length === 0 && (
        <p className="reports__note">
          Todavía no hay planes. Aparecen cuando en la selección de campeón se conoce a tu rival de línea.
        </p>
      )}
      <div className="reports__plans">
        {reports?.map((report) => (
          <article key={report.id} className="reports__plan">
            <header>
              <Lightbulb size={14} aria-hidden="true" />
              <strong>{report.champion} vs {report.opponent}</strong>
              <span className="reports__meta">{laneLabel(report.lane)}</span>
              <span className="reports__meta reports__meta--end">
                {reportDate(report.updatedAt)} · {report.source === 'groq' ? 'IA (Groq)' : 'Datos de OP.GG'}
              </span>
            </header>
            <dl>
              <dt>En línea</dt><dd>{report.plan.lane}</dd>
              <dt>Cuándo pelear</dt><dd>{report.plan.fight}</dd>
              <dt>Qué evitar</dt><dd>{report.plan.avoid}</dd>
            </dl>
          </article>
        ))}
      </div>
    </Card>
  );
}
