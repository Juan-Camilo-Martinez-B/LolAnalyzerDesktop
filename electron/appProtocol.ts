import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, net, protocol } from 'electron';

/**
 * The packaged app serves its pages from app://lolanalyzer instead of file://.
 * A real origin lets the cloud API allow exactly this app in CORS and keeps
 * localStorage stable across updates.
 */
export const APP_SCHEME = 'app';
export const APP_HOST = 'lolanalyzer';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;

/** Must run before app.whenReady(). */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
    },
  ]);
}

/** Maps app://lolanalyzer/<file> to dist/<file>, refusing anything outside dist. */
export function serveAppScheme(): void {
  const distDir = path.join(app.getAppPath(), 'dist');
  protocol.handle(APP_SCHEME, (request) => {
    const url = new URL(request.url);
    if (url.host !== APP_HOST) return new Response('Not found', { status: 404 });
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.normalize(path.join(distDir, relative));
    if (!target.startsWith(distDir + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(target).toString());
  });
}
