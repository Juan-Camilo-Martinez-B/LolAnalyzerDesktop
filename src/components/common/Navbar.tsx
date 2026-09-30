// ============================================================
// LolAnalyzer - Hextech Navigation Bar
// src/components/common/Navbar.tsx
// ============================================================

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Swords,
  BrainCircuit,
  Settings,
  ChevronRight,
  ChevronLeft,
  Gamepad2,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { AppState } from '../../context/AppContext';
import './Navbar.css';

interface NavItem {
  id: AppState['activeTab'];
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id:    'dashboard',
    label: 'Dashboard',
    icon:  <LayoutDashboard size={20} />,
  },
  {
    id:    'champ-select',
    label: 'Champ Select',
    icon:  <Swords size={20} />,
  },
  {
    id:    'coach',
    label: 'AI Coach',
    icon:  <BrainCircuit size={20} />,
  },
];

export function Navbar() {
  const { state, setActiveTab } = useApp();
  const { signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const { activeTab, gamePhase } = state;
  const isInGame = gamePhase === 'IN_GAME';

  return (
    <nav
      className={`navbar ${expanded ? 'navbar--expanded' : ''}`}
      aria-label="Main navigation"
    >
      <div className="navbar__items">
      {/* Game mode indicator */}
      {isInGame && (
        <>
          <div className="navbar__item" title="In Game">
            <button
              id="nav-btn-ingame"
              className="navbar__btn"
              style={{ color: 'var(--cyan-400)', cursor: 'default' }}
              aria-label="Currently in game"
              disabled
            >
              <Gamepad2 className="navbar__icon" aria-hidden="true" />
              {expanded && <span className="navbar__label" style={{ color: 'var(--cyan-400)' }}>In Game</span>}
            </button>
            {!expanded && <span className="navbar__tooltip">In Game</span>}
          </div>
          <div className="navbar__divider" />
        </>
      )}

      {/* Primary nav items */}
      {NAV_ITEMS.map(item => (
        <div key={item.id} className="navbar__item">
          <button
            id={`nav-btn-${item.id}`}
            className={`navbar__btn ${activeTab === item.id ? 'navbar__btn--active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="navbar__icon" aria-hidden="true">{item.icon}</span>
            {expanded && <span className="navbar__label">{item.label}</span>}
          </button>
          {!expanded && <span className="navbar__tooltip">{item.label}</span>}
        </div>
      ))}

      <div className="navbar__divider" />

      {/* Settings */}
      <div className="navbar__item">
        <button
          id="nav-btn-settings"
          className={`navbar__btn ${activeTab === 'settings' ? 'navbar__btn--active' : ''}`}
          onClick={() => setActiveTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          aria-label="Settings"
        >
          <Settings className="navbar__icon" size={20} aria-hidden="true" />
          {expanded && <span className="navbar__label">Settings</span>}
        </button>
        {!expanded && <span className="navbar__tooltip">Settings</span>}
      </div>
      </div>

      <div className="navbar__item">
        <button
          id="nav-btn-logout"
          className="navbar__btn"
          onClick={() => void signOut()}
          aria-label="Cerrar sesión"
        >
          <LogOut className="navbar__icon" size={20} aria-hidden="true" />
          {expanded && <span className="navbar__label">Salir</span>}
        </button>
        {!expanded && <span className="navbar__tooltip">Salir</span>}
      </div>

      {/* Expand / Collapse toggle */}
      <button
        id="nav-btn-toggle"
        className="navbar__toggle"
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        {expanded && (
          <span style={{ fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)', letterSpacing: '0.06em' }}>
            Collapse
          </span>
        )}
      </button>
    </nav>
  );
}
