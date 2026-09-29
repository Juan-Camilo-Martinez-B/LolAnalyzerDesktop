// ============================================================
// LolAnalyzer - Hextech TitleBar Component
// src/components/common/TitleBar.tsx
// ============================================================

import React from 'react';
import { Minus, X, Zap } from 'lucide-react';
import { minimizeWindow, closeWindow, WINDOW } from '../../services/overwolfService';
import { useConnectionStatus } from '../../hooks/useGameState';
import './TitleBar.css';

interface TitleBarProps {
  windowName?: string;
  subtitle?: string;
}

export function TitleBar({ windowName = WINDOW.DESKTOP, subtitle }: TitleBarProps) {
  const { lcu, backend } = useConnectionStatus();

  const handleMinimize = () => minimizeWindow(windowName);
  const handleClose    = () => closeWindow(windowName);

  return (
    <header className="titlebar" role="banner">
      {/* Logo */}
      <div className="titlebar__logo">
        <Zap className="titlebar__logo-icon" aria-hidden="true" />
        <span className="titlebar__title">
          LOL<span>ANALYZER</span>
        </span>
      </div>

      {/* Center — optional subtitle */}
      <div className="titlebar__center">
        {subtitle && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--slate-500)', letterSpacing: '0.08em' }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Status indicators */}
      <div className="titlebar__status" aria-label="Connection status">
        <div className="titlebar__status-item">
          <span
            className={`status-dot ${lcu === 'connected' ? 'status-dot--online' : 'status-dot--offline'}`}
            aria-label={`LCU ${lcu}`}
          />
          <span>LCU</span>
        </div>
        <div className="titlebar__status-item">
          <span
            className={`status-dot ${backend === 'connected' ? 'status-dot--online' : backend === 'reconnecting' ? 'status-dot--warning' : 'status-dot--offline'}`}
            aria-label={`Backend ${backend}`}
          />
          <span>API</span>
        </div>
      </div>

      {/* Window controls */}
      <div className="titlebar__controls" role="group" aria-label="Window controls">
        <button
          id="btn-minimize"
          className="titlebar__btn titlebar__btn--minimize"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize window"
        >
          <Minus size={13} />
        </button>
        <button
          id="btn-close"
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          title="Close"
          aria-label="Close window"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
}
