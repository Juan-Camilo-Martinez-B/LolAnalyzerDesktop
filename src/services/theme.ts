export type ThemePreference = 'light' | 'system' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'system' || value === 'dark';
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return 'light';
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = resolveTheme(preference, prefersDark);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}
