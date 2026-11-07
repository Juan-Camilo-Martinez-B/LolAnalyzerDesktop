import https from 'node:https';

const HOST = '127.0.0.1';
const PORT = 2999;
const PATHNAME = '/liveclientdata/allgamedata';
const MAX_BYTES = 2_000_000;

const CERT_CODES = new Set([
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

const localhostAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 1,
});

export function isCertificateError(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  return CERT_CODES.has(code);
}

export function fetchAllGameData(allowUnverifiedLocalCert: boolean): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host: HOST,
        port: PORT,
        path: PATHNAME,
        method: 'GET',
        timeout: 1200,
        agent: allowUnverifiedLocalCert ? localhostAgent : undefined,
        headers: { Accept: 'application/json' },
      },
      (response) => {
        const chunks: Buffer[] = [];
        let total = 0;
        response.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_BYTES) {
            request.destroy(new Error('live client payload too large'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => {
          const status = response.statusCode ?? 500;
          if (status >= 400) {
            reject(new Error(`live client status ${status}`));
            return;
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error('live client timeout')));
    request.on('error', reject);
    request.end();
  });
}
