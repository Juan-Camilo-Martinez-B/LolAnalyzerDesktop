import React from 'react';
import { useChampSelect } from '../hooks/useGameState';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';
import { CounterPickPanel } from '../components/champ-select/CounterPickPanel';

export function ChampSelectView() {
  const { myTeam, theirTeam } = useChampSelect();

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Ally vs Enemy Team Grid */}
      <TeamCompositionGrid myTeam={myTeam} theirTeam={theirTeam} />

      {/* AI Counter-Pick & Synergy Recommendation Panel */}
      <CounterPickPanel />

      {/* Placeholder for Commits 22-24 */}
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
        [ AI Champion Ban Recommendation Widget & Auto-Rune Importer loading in Commits 22-24 ]
      </div>
    </div>
  );
}
