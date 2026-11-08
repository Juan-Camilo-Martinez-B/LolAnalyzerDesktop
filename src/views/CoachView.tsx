import { useState } from 'react';
import { CoachAnalyticsTab } from '../components/dashboard/CoachAnalyticsTab';
import { PostGameReports } from '../components/reports/PostGameReports';
import { MatchupReports } from '../components/reports/MatchupReports';
import '../components/reports/reports.css';

type CoachTab = 'post-game' | 'matchups' | 'live';

const TABS: { id: CoachTab; label: string }[] = [
  { id: 'post-game', label: 'Informes post-partida' },
  { id: 'matchups', label: 'Planes de matchup' },
  { id: 'live', label: 'Consejos en vivo' },
];

/** Saved reports first: they are what the player comes back to read. */
export function CoachView() {
  const [tab, setTab] = useState<CoachTab>('post-game');
  return (
    <div className="page-view">
      <div className="coach-tabs" role="tablist" aria-label="Secciones del coach">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'post-game' && <PostGameReports />}
      {tab === 'matchups' && <MatchupReports />}
      {tab === 'live' && <CoachAnalyticsTab />}
    </div>
  );
}
