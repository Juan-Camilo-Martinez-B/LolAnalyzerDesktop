import { CheckCircle2, Crosshair, TrendingUp } from 'lucide-react';
import type { AnalysisMetric, MatchAnalysis } from '../../services/analysisClient';
import './analysis.css';

function formatValue(value: number): string {
  return value >= 100 ? Math.round(value).toString() : value.toFixed(1);
}

function MetricChip({ metric }: { metric: AnalysisMetric }) {
  return (
    <li className={`analysis-metric analysis-metric--${metric.verdict}`} title={`Meta del rol: ${formatValue(metric.target)} ${metric.unit}`}>
      <span className="analysis-metric__label">{metric.label}</span>
      <strong>{formatValue(metric.value)}</strong>
      <span className="analysis-metric__unit">{metric.unit} · meta {formatValue(metric.target)}</span>
    </li>
  );
}

/** Strengths, improvements, focus and the numbers behind them. */
export function AnalysisContent({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="analysis">
      <div className="analysis__sections">
        <section className="analysis__section analysis__section--good">
          <h4><CheckCircle2 size={14} /> Lo que salió bien</h4>
          <p>{analysis.strengths}</p>
        </section>
        <section className="analysis__section analysis__section--bad">
          <h4><TrendingUp size={14} /> Qué mejorar</h4>
          <p>{analysis.improvements}</p>
        </section>
        <section className="analysis__section analysis__section--focus">
          <h4><Crosshair size={14} /> Foco para la próxima</h4>
          <p>{analysis.focus}</p>
        </section>
      </div>
      {analysis.metrics.length > 0 && (
        <ul className="analysis__metrics" aria-label="Métricas frente a la referencia del rol">
          {analysis.metrics.map((metric) => <MetricChip key={metric.key} metric={metric} />)}
        </ul>
      )}
      <p className="analysis__source">
        {analysis.source === 'groq' ? 'Redactado con IA (Groq) a partir de tus métricas.' : 'Generado con reglas a partir de tus métricas.'}
      </p>
    </div>
  );
}
