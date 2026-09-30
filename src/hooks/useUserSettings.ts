import { useCallback, useEffect, useState } from 'react';
import {
  loadSettings,
  patchSettings,
  subscribeSettings,
  type UserSettings,
} from '../services/settingsStore';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => subscribeSettings(setSettings), []);

  const update = useCallback((patch: Parameters<typeof patchSettings>[0]) => {
    setSettings(patchSettings(patch));
  }, []);

  return { settings, update };
}
