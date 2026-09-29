import React from 'react';
import { useChampSelect } from '../hooks/useGameState';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';
import { CounterPickPanel } from '../components/champ-select/CounterPickPanel';
import { BanRecommendationWidget } from '../components/champ-select/BanRecommendationWidget';
import { AutoRuneImporter } from '../components/champ-select/AutoRuneImporter';

export function ChampSelectView() {
  const { myTeam, theirTeam } = useChampSelect();

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Ally vs Enemy Team Grid */}
      <TeamCompositionGrid myTeam={myTeam} theirTeam={theirTeam} />

      {/* Auto Runes & Spells Importer */}
      <AutoRuneImporter championName="Ahri" />

      {/* AI Ban Recommendation Widget */}
      <BanRecommendationWidget />

      {/* AI Counter-Pick & Synergy Recommendation Panel */}
      <CounterPickPanel />
    </div>
  );
}
