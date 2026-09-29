import React from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';
import { TiltOMeterGauge } from '../components/dashboard/TiltOMeterGauge';

export function DashboardView() {
  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Player Profile Header */}
      <ProfileHeader />

      {/* KPI Metric Summary Cards Grid */}
      <KpiSummaryCards />

      {/* Mental Tilt-o-Meter Gauge */}
      <TiltOMeterGauge />

      {/* Placeholder for Commits 16-19 */}
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
        [ Champion Performance Table & Match History loading in Commits 16-19 ]
      </div>
    </div>
  );
}
