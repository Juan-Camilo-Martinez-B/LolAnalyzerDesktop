import React, { useCallback, useState } from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';
import { TiltOMeterGauge } from '../components/dashboard/TiltOMeterGauge';
import { ChampionPerformanceTable } from '../components/dashboard/ChampionPerformanceTable';
import { MatchHistoryList } from '../components/dashboard/MatchHistoryList';
import { MatchDetailModal } from '../components/dashboard/MatchDetailModal';
import '../components/dashboard/dashboardHero.css';

export function DashboardView() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleSelectMatch = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
  }, []);

  return (
    <div className="page-view">
      <div className="dashboard-hero">
        <ProfileHeader />
        <TiltOMeterGauge />
      </div>

      <KpiSummaryCards />

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
