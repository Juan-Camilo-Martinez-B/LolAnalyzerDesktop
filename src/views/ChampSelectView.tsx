import React from 'react';
import { Clock, ShieldAlert, Zap, Radio } from 'lucide-react';
import { useChampSelect, useGamePhase } from '../hooks/useGameState';
import { TeamCompositionGrid } from '../components/champ-select/TeamCompositionGrid';
import { CounterPickPanel } from '../components/champ-select/CounterPickPanel';
import { BanRecommendationWidget } from '../components/champ-select/BanRecommendationWidget';
import { AutoRuneImporter } from '../components/champ-select/AutoRuneImporter';
import { Badge, Card } from '../components/ui';

export function ChampSelectView() {
  const { session, isActive, myTeam, theirTeam } = useChampSelect();
  const { isChampSel } = useGamePhase();

  const phaseTimer = session?.timer?.adjustedTimeLeftInPhase
    ? Math.max(0, Math.floor(session.timer.adjustedTimeLeftInPhase / 1000))
    : 27;

  const phaseName = session?.timer?.phase || 'BAN_PICK_PHASE';

  return (
    <div className="page-view">
      {/* Champ Select Phase Status Header Bar */}
      <Card
        variant="gold"
        style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(200, 155, 60, 0.12) 0%, rgba(10, 14, 23, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio size={20} color="var(--hextech-gold)" className="animate-pulse" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--hextech-gold)', textTransform: 'uppercase' }}>
                {phaseName.replace(/_/g, ' ')}
              </h3>
              <Badge variant={isChampSel ? 'win' : 'gold'}>
                {isChampSel ? 'LCU Live Sync' : 'Simulated Session'}
              </Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time AI draft guidance & counter-pick suggestions active
            </div>
          </div>
        </div>

        {/* Phase Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-gold)', padding: '6px 14px', borderRadius: '8px' }}>
          <Clock size={16} color="var(--hextech-gold)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: phaseTimer <= 5 ? 'var(--accent-red)' : 'var(--hextech-gold)' }}>
            {phaseTimer}s
          </span>
        </div>
      </Card>

      {/* Team Composition Grid */}
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
