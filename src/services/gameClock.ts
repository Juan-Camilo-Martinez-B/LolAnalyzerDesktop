// High-frequency match clock. Kept outside React state so a 1s tick
// does not re-render the dashboard, settings, or champion select.

let seconds = 0;
const listeners = new Set<() => void>();

export function getGameClock(): number {
  return seconds;
}

export function setGameClock(next: number): void {
  if (seconds === next) return;
  seconds = next;
  listeners.forEach((listener) => listener());
}

export function subscribeGameClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
