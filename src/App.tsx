// ============================================================
// LolAnalyzer - Main Desktop App Shell
// src/App.tsx
// ============================================================

import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TitleBar } from './components/common/TitleBar';
import { Navbar }   from './components/common/Navbar';
import { EventSimulatorBar } from './components/debug/EventSimulatorBar';
import './index.css';

// ── Lazy page views ─────────────────────────────────────────
const DashboardView   = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const ChampSelectView = lazy(() => import('./views/ChampSelectView').then(m => ({ default: m.ChampSelectView })));
const CoachView       = lazy(() => import('./views/CoachView').then(m => ({ default: m.CoachView })));
const SettingsView    = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

// ── Loading placeholder ──────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="page-skeleton">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton" style={{ width: 180, height: 14 }} />
        <div className="skeleton" style={{ width: 120, height: 10 }} />
      </div>
    </div>
  );
}

// ── Inner shell (needs AppContext) ───────────────────────────
function AppShell() {
  const { state } = useApp();
  const { activeTab } = state;

  return (
    <div className="app-shell">
      {/* Top title bar */}
      <TitleBar />

      {/* Main layout */}
      <div className="app-body">
        {/* Left nav */}
        <Navbar />

        {/* Page area */}
        <main id="main-content" role="main">
          <Suspense fallback={<PageSkeleton />}>
            {activeTab === 'dashboard'    && <DashboardView />}
            {activeTab === 'champ-select' && <ChampSelectView />}
            {activeTab === 'coach'        && <CoachView />}
            {activeTab === 'settings'     && <SettingsView />}
          </Suspense>
        </main>
      </div>
      <EventSimulatorBar />
    </div>
  );
}

// ── Root export ──────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
