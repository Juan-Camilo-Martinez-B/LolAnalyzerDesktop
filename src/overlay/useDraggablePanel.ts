// ============================================================
// LolAnalyzer - Drag the HUD panel inside the game window
// src/overlay/useDraggablePanel.ts
//
// The overlay window already covers the game, so dragging moves the
// panel inside it. The spot is stored as fractions of the window so
// it survives a resolution change.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { clampPosition, type PanelPosition } from './hudMetrics';

const POSITION_KEY = 'lolanalyzer.overlayPosition.v1';

function readStored(): PanelPosition | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PanelPosition>;
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function store(position: PanelPosition | null): void {
  try {
    if (position) localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    else localStorage.removeItem(POSITION_KEY);
  } catch {
    // Blocked storage only means the spot is not remembered.
  }
}

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

export interface DraggablePanel {
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Absolute placement when the player moved the panel; null keeps the anchor from Settings. */
  style: React.CSSProperties | null;
  dragging: boolean;
  handleProps: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  };
  reset: () => void;
}

export function useDraggablePanel(enabled: boolean): DraggablePanel {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PanelPosition | null>(() => readStored());
  const [dragging, setDragging] = useState(false);
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  const clampToWindow = useCallback((next: PanelPosition): PanelPosition => {
    const panel = panelRef.current?.getBoundingClientRect();
    return clampPosition(next, { width: panel?.width ?? 0, height: panel?.height ?? 0 }, viewport());
  }, []);

  // A resize of the game window must not leave the panel off screen.
  useEffect(() => {
    const onResize = () => setPosition((current) => (current ? clampToWindow(current) : current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToWindow]);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0 || !panelRef.current) return;
    if ((event.target as HTMLElement).closest('button, input, select, a')) return;
    const rect = panelRef.current.getBoundingClientRect();
    grab.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!grab.current) return;
    const { width, height } = viewport();
    setPosition(clampToWindow({
      x: (event.clientX - grab.current.dx) / Math.max(1, width),
      y: (event.clientY - grab.current.dy) / Math.max(1, height),
    }));
  };

  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (!grab.current) return;
    grab.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPosition((current) => {
      store(current);
      return current;
    });
  };

  const reset = () => {
    store(null);
    setPosition(null);
  };

  const style: React.CSSProperties | null = position
    ? { position: 'fixed', left: `${position.x * 100}%`, top: `${position.y * 100}%` }
    : null;

  return {
    panelRef,
    style,
    dragging,
    handleProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish },
    reset,
  };
}
