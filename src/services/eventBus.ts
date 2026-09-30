// ============================================================
// LolAnalyzer - Event Bus (typed publish/subscribe)
// src/services/eventBus.ts
// Connects the three Overwolf windows without coupling them.
// ============================================================

import type { LiveGameEvent, GamePhase, ChampSelectSession } from '../types/game';
import type { TiltAlert, CoachMessage, OverlayState } from '../types/coach';

/** All events that can be published across the app */
export type AppEventMap = {
  // Game lifecycle
  'game:phase_changed':     { phase: GamePhase };
  'game:connected':         void;
  'game:disconnected':      void;
  // Live game
  'game:event':             LiveGameEvent;
  'game:time_update':       { seconds: number };
  // Champion selection
  'champ_select:started':   ChampSelectSession;
  'champ_select:updated':   ChampSelectSession;
  'champ_select:ended':     void;
  // Coach & Tilt
  'coach:message':          CoachMessage;
  'coach:tilt_alert':       TiltAlert;
  'coach:tilt_cleared':     void;
  // Overlay
  'overlay:state_changed':  Partial<OverlayState>;
  'overlay:toggle':         void;
  'overlay:set_mode':       { mode: OverlayState['mode'] };
  'overlay:cycle_mode':     void;
  // Backend / LCU sync
  'lcu:connected':          void;
  'lcu:disconnected':       void;
  'backend:sync_complete':  void;
  'backend:error':          { message: string };
};

type EventKey = keyof AppEventMap;
type Handler<K extends EventKey> = AppEventMap[K] extends void
  ? () => void
  : (payload: AppEventMap[K]) => void;

class EventBus {
  private listeners = new Map<EventKey, Set<Handler<EventKey>>>();

  on<K extends EventKey>(event: K, handler: Handler<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Handler<EventKey>);
    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off<K extends EventKey>(event: K, handler: Handler<K>): void {
    this.listeners.get(event)?.delete(handler as Handler<EventKey>);
  }

  emit<K extends EventKey>(
    event: K,
    ...args: AppEventMap[K] extends void ? [] : [AppEventMap[K]]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach(h => (h as (...a: unknown[]) => void)(...args));
  }

  once<K extends EventKey>(event: K, handler: Handler<K>): void {
    const wrapped: Handler<K> = ((...args: unknown[]) => {
      (handler as (...a: unknown[]) => void)(...args);
      this.off(event, wrapped);
    }) as Handler<K>;
    this.on(event, wrapped);
  }

  clear(event?: EventKey): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/** Singleton event bus shared across the app */
export const eventBus = new EventBus();
