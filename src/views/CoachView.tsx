import React from 'react';
import { CoachAnalyticsTab } from '../components/dashboard/CoachAnalyticsTab';

export function CoachView() {
  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      <CoachAnalyticsTab />
    </div>
  );
}
