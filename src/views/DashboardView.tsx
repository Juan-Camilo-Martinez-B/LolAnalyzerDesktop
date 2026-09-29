import React, { useState } from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';
import { TiltOMeterGauge } from '../components/dashboard/TiltOMeterGauge';
import { ChampionPerformanceTable } from '../components/dashboard/ChampionPerformanceTable';
import { MatchHistoryList } from '../components/dashboard/MatchHistoryList';

export function DashboardView() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
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
    </div>
  );
}
