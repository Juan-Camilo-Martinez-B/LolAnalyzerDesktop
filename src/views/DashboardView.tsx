import React, { useCallback, useState } from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';
import { TiltOMeterGauge } from '../components/dashboard/TiltOMeterGauge';
import { ChampionPerformanceTable } from '../components/dashboard/ChampionPerformanceTable';
import { MatchHistoryList } from '../components/dashboard/MatchHistoryList';
import { MatchDetailModal } from '../components/dashboard/MatchDetailModal';

export function DashboardView() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleSelectMatch = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
  }, []);

  return (
    <div className="page-view">
      {/* Player Profile Header */}
      <ProfileHeader />

      {/* KPI Metric Summary Cards Grid */}
      <KpiSummaryCards />

      {/* Mental Tilt-o-Meter Gauge */}
      <TiltOMeterGauge />

      {/* Champion Mastery & Performance Table */}
      <ChampionPerformanceTable />

      {/* Recent Match History List */}
      <MatchHistoryList onSelectMatch={handleSelectMatch} />

      {/* Match Detail Modal */}
      <MatchDetailModal
        isOpen={selectedMatchId !== null}
        onClose={() => setSelectedMatchId(null)}
        matchId={selectedMatchId}
      />
    </div>
  );
}
