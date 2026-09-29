import React from 'react';
import { ProfileHeader } from '../components/dashboard/ProfileHeader';

export function DashboardView() {
  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      {/* Player Profile Header */}
      <ProfileHeader />

      {/* Placeholders for upcoming Commits 14-19 */}
      <div
        style={{
          flex: 1,
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
        [ Dashboard Metrics, Tilt Gauge, Performance Table & Match History loading in Commits 14-19 ]
      </div>
    </div>
  );
}
