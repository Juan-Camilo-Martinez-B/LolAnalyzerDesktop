import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, app, screen, type Rectangle, type WebPreferences } from 'electron';
import { hardenContents } from './security.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export interface AppWindows {
  desktop: BrowserWindow;
  overlay: BrowserWindow;
  background: BrowserWindow;
}

function rendererUrl(page: 'index.html' | 'overlay.html' | 'background.html'): string | null {
  const dev = process.env.ELECTRON_RENDERER_URL;
  if (!dev) return null;
  if (page === 'index.html') return `${dev}/`;
  return `${dev}/${page}`;
}

function webPreferences(): WebPreferences {
  return {
    preload: path.join(moduleDir, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    spellcheck: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    webviewTag: false,
  };
}

function loadPage(win: BrowserWindow, page: 'index.html' | 'overlay.html' | 'background.html'): void {
  const devUrl = rendererUrl(page);
  if (devUrl) {
    void win.loadURL(devUrl);
    return;
  }
  void win.loadFile(path.join(app.getAppPath(), 'dist', page));
}

export function createAppWindows(): AppWindows {
  const desktop = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0e14',
    webPreferences: webPreferences(),
  });
  hardenContents(desktop.webContents);
  desktop.once('ready-to-show', () => {
    desktop.show();
  });
  loadPage(desktop, 'index.html');

  const background = new BrowserWindow({
    show: false,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    width: 400,
    height: 300,
    webPreferences: webPreferences(),
  });
  hardenContents(background.webContents);
  loadPage(background, 'background.html');

  const workArea = screen.getPrimaryDisplay().workArea;
  const overlay = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: Math.max(320, workArea.width),
    height: Math.max(240, workArea.height),
    transparent: true,
    frame: false,
    show: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    webPreferences: webPreferences(),
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  // Click-through from the start. Only the edit mode (Ctrl+Shift+L) takes the mouse.
  overlay.setIgnoreMouseEvents(true);
  hardenContents(overlay.webContents);
  loadPage(overlay, 'overlay.html');

  return { desktop, overlay, background };
}

export function toDipBounds(bounds: { x: number; y: number; width: number; height: number }): Rectangle {
  return screen.screenToDipRect(null, bounds);
}
