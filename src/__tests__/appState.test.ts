import { afterEach, describe, expect, it } from 'vitest';
import { appReducer, initialState } from '../context/AppContext';
import { eventBus } from '../services/eventBus';

describe('app state', () => {
  afterEach(() => {
    eventBus.clear();
  });

  it('merges overlay patches without dropping the rest of the HUD', () => {
    const next = appReducer(initialState, { type: 'SET_OVERLAY', payload: { opacity: 0.5 } });
    expect(next.overlayState.opacity).toBe(0.5);
    expect(next.overlayState.mode).toBe('compact');
    expect(initialState.overlayState.opacity).toBe(0.92);
  });

  it('toggles overlay visibility', () => {
    const shown = appReducer(initialState, { type: 'TOGGLE_OVERLAY_VISIBLE' });
    expect(shown.overlayState.visible).toBe(true);
    const hidden = appReducer(shown, { type: 'TOGGLE_OVERLAY_VISIBLE' });
    expect(hidden.overlayState.visible).toBe(false);
  });

  it('cycles compact and expanded and forces the HUD visible', () => {
    const expanded = appReducer(initialState, { type: 'CYCLE_OVERLAY_MODE' });
    expect(expanded.overlayState.mode).toBe('expanded');
    expect(expanded.overlayState.visible).toBe(true);

    const compact = appReducer(expanded, { type: 'CYCLE_OVERLAY_MODE' });
    expect(compact.overlayState.mode).toBe('compact');
  });

  it('stores the game phase', () => {
    const next = appReducer(initialState, { type: 'SET_GAME_PHASE', payload: 'IN_GAME' });
    expect(next.gamePhase).toBe('IN_GAME');
    expect(initialState.gamePhase).toBe('NONE');
  });

  it('publishes and unsubscribes on the event bus', () => {
    const seen: number[] = [];
    const unsubscribe = eventBus.on('game:time_update', ({ seconds }) => {
      seen.push(seconds);
    });

    eventBus.emit('game:time_update', { seconds: 15 });
    unsubscribe();
    eventBus.emit('game:time_update', { seconds: 30 });

    expect(seen).toEqual([15]);
  });

  it('runs a once-listener a single time', () => {
    let calls = 0;
    eventBus.once('coach:tilt_cleared', () => {
      calls += 1;
    });
    eventBus.emit('coach:tilt_cleared');
    eventBus.emit('coach:tilt_cleared');
    expect(calls).toBe(1);
  });
});
