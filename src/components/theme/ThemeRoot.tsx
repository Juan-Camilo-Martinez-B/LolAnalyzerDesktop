import { useEffect } from 'react';
import { useUserSettings } from '../../hooks/useUserSettings';
import { applyTheme } from '../../services/theme';

export function ThemeRoot() {
  const { settings } = useUserSettings();

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [settings.theme]);

  return null;
}
