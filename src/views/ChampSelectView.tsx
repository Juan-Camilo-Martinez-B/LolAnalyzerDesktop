import React from 'react';
import { useChampSelect } from '../hooks/useGameState';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';
import { CounterPickPanel } from '../components/champ-select/CounterPickPanel';
import { BanRecommendationWidget } from '../components/champ-select/BanRecommendationWidget';

export function ChampSelectView() {
  const { myTeam, theirTeam } = useChampSelect();

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Ally vs Enemy Team Grid */}
      <TeamCompositionGrid myTeam={myTeam} theirTeam={theirTeam} />

      {/* AI Ban Recommendation Widget */}
      <BanRecommendationWidget />

      {/* AI Counter-Pick & Synergy Recommendation Panel */}
      <CounterPickPanel />

      {/* Placeholder for Commits 23-24 */}
      <div
        style={{
          border: '1px dashed var(--border-dark)',
          borderRadius: '12px',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        [ Auto-Rune Importer & Full Champ Select Flow loading in Commits 23-24 ]
      </div>
    </div>
  );
}
