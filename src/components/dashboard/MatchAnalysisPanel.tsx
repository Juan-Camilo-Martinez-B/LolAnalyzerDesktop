import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Spinner } from '../ui';
import { AnalysisContent } from '../coach/AnalysisContent';
import { createAnalysis, fetchAnalysis, type MatchAnalysis } from '../../services/analysisClient';
import { messageFromUnknown } from '../../services/userErrors';

/**
 * Analysis inside the match detail. New games already have one; older games
 * offer a button, so tokens are only spent on games the player opens.
 */
export function MatchAnalysisPanel({ matchId }: { matchId: string }) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'working' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAnalysis(matchId)
      .then((stored) => {
        if (!active) return;
        setAnalysis(stored);
        setState(stored ? 'ready' : 'missing');
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(messageFromUnknown(reason));
        setState('error');
      });
    return () => {
      active = false;
    };
  }, [matchId]);

  const analyse = async () => {
    setState('working');
    setError(null);
    try {
      const created = await createAnalysis(matchId);
      setAnalysis(created);
      setState('ready');
    } catch (reason) {
      setError(messageFromUnknown(reason));
      setState('missing');
    }
  };

  return (
    <div className="match-analysis">
      <div className="match-row__mode" style={{ marginBottom: 8 }}>Análisis</div>
      {state === 'loading' && <div className="match-detail__sub"><Spinner size="sm" /> Buscando el análisis…</div>}
      {state === 'ready' && analysis && <AnalysisContent analysis={analysis} />}
      {(state === 'missing' || state === 'working') && (
        <div className="match-analysis__empty">
          <span className="match-detail__sub">Esta partida todavía no tiene análisis.</span>
          <button type="button" className="match-analysis__action" onClick={() => void analyse()} disabled={state === 'working'}>
            <Sparkles size={13} /> {state === 'working' ? 'Analizando…' : 'Analizar esta partida'}
          </button>
        </div>
      )}
      {error && <p className="match-analysis__error">{error}</p>}
    </div>
  );
}
