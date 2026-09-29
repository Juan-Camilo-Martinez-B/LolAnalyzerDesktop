import React from 'react';
import { useChampSelect } from '../hooks/useGameState';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';

export function ChampSelectView() {
  const { myTeam, theirTeam } = useChampSelect();

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Ally vs Enemy Team Grid */}
      <TeamCompositionGrid myTeam={myTeam} theirTeam={theirTeam} />

      {/* Placeholder for Commits 21-24 */}
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
        [ Counter-Pick Recommendations, AI Ban Widget & Auto-Rune Importer loading in Commits 21-24 ]
      </div>
    </div>
  );
}
