import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { eventBus } from '../services/eventBus';
import type { GamePhase } from '../types/game';
import { shouldOpenChampSelect } from './useClientPhase';
import { useUserSettings } from './useUserSettings';

/** Opens the champion select tab when the client enters champion select, if Settings allows it. */
export function useAutoOpenChampSelect(): void {
  const { setActiveTab } = useApp();
  const { settings } = useUserSettings();
  const enabled = settings.loadout.openChampSelect;
  const previous = useRef<GamePhase | null>(null);

  useEffect(() => eventBus.on('game:phase_changed', ({ phase }) => {
    const open = shouldOpenChampSelect(previous.current, phase, enabled);
    previous.current = phase;
    if (open) setActiveTab('champ-select');
  }), [enabled, setActiveTab]);
}
