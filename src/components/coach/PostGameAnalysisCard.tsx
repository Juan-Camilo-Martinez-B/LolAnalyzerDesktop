import { BarChart3, X } from 'lucide-react';
import { Badge, Card } from '../ui';
import { usePostGameAnalysis } from '../../hooks/usePostGameAnalysis';
import { AnalysisContent } from './AnalysisContent';

/** Appears after a game with that game's analysis, until the player closes it. */
export function PostGameAnalysisCard() {
  const { analysis, dismiss } = usePostGameAnalysis();
  if (!analysis) return null;

  return (
    <Card variant={analysis.win ? 'cyan' : 'gold'} className="post-game">
      <div className="post-game__head">
        <BarChart3 size={16} color="var(--hextech-gold)" />
        <strong>Análisis de tu última partida · {analysis.championName}</strong>
        <Badge variant={analysis.win ? 'win' : 'loss'}>{analysis.win ? 'Victoria' : 'Derrota'}</Badge>
        <button type="button" className="post-game__close" onClick={dismiss} aria-label="Cerrar análisis">
          <X size={14} />
        </button>
      </div>
      <AnalysisContent analysis={analysis} />
    </Card>
  );
}
