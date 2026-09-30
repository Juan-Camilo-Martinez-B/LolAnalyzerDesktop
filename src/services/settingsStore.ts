// ============================================================
// LolAnalyzer - Desktop preferences (local, shared by windows)
// src/services/settingsStore.ts
//
// Desktop and overlay are separate pages. localStorage is the
// bridge so a change in Settings moves the overlay too.
// ============================================================

export type CoachSensitivity = 'low' | 'balanced' | 'high';
export type OverlayAnchor = 'top-left' | 'top-center' | 'bottom-left';

export interface AudioPreferences {
  muted: boolean;
  tiltAlerts: boolean;
  objectiveAlerts: boolean;
  uiClicks: boolean;
}

export interface UserSettings {
  coachSensitivity: CoachSensitivity;
  overlayAnchor: OverlayAnchor;
  overlayOpacity: number;
  audio: AudioPreferences;
}

export const SETTINGS_STORAGE_KEY = 'lolanalyzer.settings.v1';
const SETTINGS_EVENT = 'lolanalyzer:settings';

export const DEFAULT_SETTINGS: UserSettings = {
  coachSensitivity: 'balanced',
  overlayAnchor: 'top-left',
  overlayOpacity: 0.92,
  audio: {
    muted: false,
    tiltAlerts: true,
    objectiveAlerts: true,
    uiClicks: true,
  },
};

/** Deaths required before the background coordinator raises a tilt alert. */
export function deathsBeforeTiltAlert(sensitivity: CoachSensitivity): number {
  if (sensitivity === 'high') return 1;
  if (sensitivity === 'low') return 3;
  return 2;
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.overlayOpacity;
  return Math.min(1, Math.max(0.35, value));
}

function isSensitivity(value: unknown): value is CoachSensitivity {
  return value === 'low' || value === 'balanced' || value === 'high';
}

function isAnchor(value: unknown): value is OverlayAnchor {
  return value === 'top-left' || value === 'top-center' || value === 'bottom-left';
}

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      coachSensitivity: isSensitivity(parsed.coachSensitivity) ? parsed.coachSensitivity : DEFAULT_SETTINGS.coachSensitivity,
      overlayAnchor: isAnchor(parsed.overlayAnchor) ? parsed.overlayAnchor : DEFAULT_SETTINGS.overlayAnchor,
      overlayOpacity: clampOpacity(parsed.overlayOpacity ?? DEFAULT_SETTINGS.overlayOpacity),
      audio: {
        muted: parsed.audio?.muted ?? DEFAULT_SETTINGS.audio.muted,
        tiltAlerts: parsed.audio?.tiltAlerts ?? DEFAULT_SETTINGS.audio.tiltAlerts,
        objectiveAlerts: parsed.audio?.objectiveAlerts ?? DEFAULT_SETTINGS.audio.objectiveAlerts,
        uiClicks: parsed.audio?.uiClicks ?? DEFAULT_SETTINGS.audio.uiClicks,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: UserSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent<UserSettings>(SETTINGS_EVENT, { detail: next }));
}

export function patchSettings(patch: {
  coachSensitivity?: CoachSensitivity;
  overlayAnchor?: OverlayAnchor;
  overlayOpacity?: number;
  audio?: Partial<AudioPreferences>;
}): UserSettings {
  const current = loadSettings();
  const next: UserSettings = {
    ...current,
    ...patch,
    overlayOpacity: clampOpacity(patch.overlayOpacity ?? current.overlayOpacity),
    audio: { ...current.audio, ...patch.audio },
  };
  saveSettings(next);
  return next;
}

export function subscribeSettings(listener: (settings: UserSettings) => void): () => void {
  const onCustom = (event: Event) => {
    listener((event as CustomEvent<UserSettings>).detail);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_STORAGE_KEY) listener(loadSettings());
  };
  window.addEventListener(SETTINGS_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SETTINGS_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
