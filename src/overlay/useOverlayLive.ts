// ============================================================
// LolAnalyzer - Live data for the in-game HUD
// src/overlay/useOverlayLive.ts
//
// Stats come from the Electron live-client agent, coach advice is
// relayed by the desktop window, and deaths feed the tilt reading.
// ============================================================

import { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';
import {
  isElectronApp,
  subscribeOverlayLive,
  type OverlayCoachAdvice,
  type OverlayPlayerStats,
} from '../services/overwolfService';

export interface OverlayLive {
  stats: OverlayPlayerStats | null;
  advice: OverlayCoachAdvice | null;
  /** Game seconds of each local death this match. */
  deathTimes: number[];
  /** True while the HUD is unlocked for dragging (Ctrl+Shift+L). */
  editMode: boolean;
}

export function useOverlayLive(): OverlayLive {
  const [stats, setStats] = useState<OverlayPlayerStats | null>(null);
  const [advice, setAdvice] = useState<OverlayCoachAdvice | null>(null);
  const [deathTimes, setDeathTimes] = useState<number[]>([]);
  // Outside Electron there is no click-through window, so the panel is always movable.
  const [editMode, setEditMode] = useState(!isElectronApp());

  useEffect(() => subscribeOverlayLive({
    onStats: (next) => {
      setStats(next);
      if (!next) {
        setDeathTimes([]);
        setAdvice(null);
      }
    },
    onAdvice: setAdvice,
    onEditMode: setEditMode,
  }), []);

  useEffect(() => eventBus.on('game:event', (event) => {
    if (event.type === 'death') {
      setDeathTimes((times) => [...times, event.timestamp]);
    } else if (event.type === 'game_start' || event.type === 'game_end') {
      setDeathTimes([]);
    }
  }), []);

  return { stats, advice, deathTimes, editMode };
}
