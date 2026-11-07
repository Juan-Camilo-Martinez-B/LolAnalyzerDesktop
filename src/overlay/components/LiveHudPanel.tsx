import React from 'react';
import { Clock, Coins, Lock, Maximize2, Minimize2, Move, Sparkles, Swords, Target } from 'lucide-react';
import type { OverlayCoachAdvice, OverlayPlayerStats } from '../../services/overwolfService';
import {
  csPerMinute,
  csTargetForPosition,
  formatClock,
  formatGold,
  kdaRatio,
  positionLabel,
  type TiltReading,
} from '../hudMetrics';

export interface LiveHudPanelProps {
  stats: OverlayPlayerStats | null;
  gameTimeSec: number;
  tilt: TiltReading;
  advice: OverlayCoachAdvice | null;
  expanded: boolean;
  editMode: boolean;
  onToggleExpanded: () => void;
  /** Readable shortcut for compact/expanded, e.g. Ctrl+Shift+M. */
  cycleShortcut: string;
}

/** Header, live numbers, tilt and the latest coach tip. No placeholder numbers. */
export const LiveHudPanel: React.FC<LiveHudPanelProps> = ({
  stats,
  gameTimeSec,
  tilt,
  advice,
  expanded,
  editMode,
  onToggleExpanded,
  cycleShortcut,
}) => {
  const clock = stats ? stats.gameTime : gameTimeSec;
  const perMinute = stats ? csPerMinute(stats.creepScore, stats.gameTime) : 0;
  const target = csTargetForPosition(stats?.position);
  const delta = target != null && perMinute > 0 ? perMinute - target : null;
  const role = positionLabel(stats?.position);

  return (
    <>
      <div className={`hud-head ${editMode ? 'is-editing' : ''}`}>
        <span className="hud-head__clock">
          <Clock size={12} />
          {clock > 0 ? formatClock(clock) : '--:--'}
        </span>
        <span className="hud-head__champ">
          {stats?.championName ?? 'LolAnalyzer'}
          {stats && stats.level > 0 && <span className="hud-head__level">Nv {stats.level}</span>}
          {role && <span className="hud-head__role">{role}</span>}
        </span>
        <span className="hud-head__actions">
          {editMode ? <Move size={12} aria-label="Modo mover activo" /> : <Lock size={11} aria-label="HUD fijo" />}
          <button
            type="button"
            className="overlay-icon-btn"
            onClick={onToggleExpanded}
            title={`${expanded ? 'Compactar' : 'Expandir'} (${cycleShortcut})`}
            aria-label={expanded ? 'Compactar overlay' : 'Expandir overlay'}
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </span>
      </div>

      {stats ? (
        <div className="hud-body">
          <div className="hud-stats">
            <div className="hud-stat">
              <span className="hud-stat__label"><Swords size={11} /> KDA</span>
              <strong>{stats.kills}/{stats.deaths}/{stats.assists}</strong>
              <span className="hud-stat__sub">{kdaRatio(stats.kills, stats.deaths, stats.assists).toFixed(1)}</span>
            </div>
            <div className="hud-stat">
              <span className="hud-stat__label"><Target size={11} /> CS</span>
              <strong>{stats.creepScore}</strong>
              <span className="hud-stat__sub">
                {perMinute > 0 ? `${perMinute.toFixed(1)}/min` : '—'}
                {delta != null && (
                  <em className={delta >= 0 ? 'is-ahead' : 'is-behind'}>
                    {' '}{delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                  </em>
                )}
              </span>
            </div>
            <div className="hud-stat">
              <span className="hud-stat__label"><Coins size={11} /> Oro</span>
              <strong>{formatGold(stats.currentGold)}</strong>
              <span className="hud-stat__sub">disponible</span>
            </div>
          </div>

          <div className="hud-row">
            <span className={`mini-hud-tilt ${tilt.active ? 'is-alert' : 'is-stable'}`}>
              <span className="mini-hud-dot" />
              {tilt.active ? `Tilt · ${tilt.label}` : tilt.label}
            </span>
            {target != null && (
              <span className="hud-row__goal">Meta {target.toFixed(1)} CS/min</span>
            )}
          </div>

          {advice && (
            <p className={`hud-advice hud-advice--${advice.category === 'praise' ? 'praise' : advice.severity.toLowerCase()}`}>
              <Sparkles size={12} />
              <span>{advice.text}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="hud-waiting">Esperando datos de la partida…</p>
      )}
    </>
  );
};
