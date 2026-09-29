import React from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';

export function DashboardView() {
  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Player Profile Header */}
      <ProfileHeader />

      {/* KPI Metric Summary Cards Grid */}
      <KpiSummaryCards />

      {/* Placeholder for Commits 15-19 */}
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
        [ Tilt-o-Meter Gauge, Champion Performance Table & Match History loading in Commits 15-19 ]
      </div>
    </div>
  );
}
