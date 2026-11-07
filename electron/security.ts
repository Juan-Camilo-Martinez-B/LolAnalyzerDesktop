import { app, type WebContents } from 'electron';

function rendererOrigin(): string | null {
  const dev = process.env.ELECTRON_RENDERER_URL;
  if (!dev) return null;
  try {
    return new URL(dev).origin;
  } catch {
    return null;
  }
}

export function isAllowedNavigation(url: string): boolean {
  if (url.startsWith('file:')) return true;
  const origin = rendererOrigin();
  if (!origin) return false;
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

export function hardenContents(contents: WebContents): void {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
    }
  });
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
  if (app.isPackaged) {
    contents.on('before-input-event', (event, input) => {
      const key = input.key.toLowerCase();
      const devtools = key === 'f12' || (input.control && input.shift && key === 'i');
      if (devtools) event.preventDefault();
    });
  }
}
