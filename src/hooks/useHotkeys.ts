import { useEffect, useState } from 'react';
import { DEFAULT_HOTKEYS, getHotkeys, subscribeHotkeys, type HotkeyStatus } from '../services/overwolfService';

/**
 * Live overlay shortcuts and the ones another program holds: read from the
 * main process and updated when Settings changes them.
 */
export function useHotkeys(): [HotkeyStatus, (status: HotkeyStatus) => void] {
  const [config, setConfig] = useState<HotkeyStatus>({ config: DEFAULT_HOTKEYS, inactive: [] });

  useEffect(() => {
    let active = true;
    void getHotkeys().then((current) => {
      if (active) setConfig(current);
    });
    const stop = subscribeHotkeys(setConfig);
    return () => {
      active = false;
      stop();
    };
  }, []);

  return [config, setConfig];
}
