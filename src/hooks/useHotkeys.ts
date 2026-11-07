import { useEffect, useState } from 'react';
import { DEFAULT_HOTKEYS, getHotkeys, subscribeHotkeys, type HotkeyConfig } from '../services/overwolfService';

/** Live overlay shortcuts: read from the main process and updated when Settings changes them. */
export function useHotkeys(): [HotkeyConfig, (config: HotkeyConfig) => void] {
  const [config, setConfig] = useState<HotkeyConfig>(DEFAULT_HOTKEYS);

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
