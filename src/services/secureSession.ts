const DB_NAME = 'lolanalyzer-secure';
const STORE = 'keys';
const KEY_ID = 'refresh-key';
const CIPHER_KEY = 'lolanalyzer.refresh.cipher.v1';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function base64ToBuffer(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readKey(): Promise<CryptoKey | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY_ID);
    request.onsuccess = () => resolve((request.result as CryptoKey | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeKey(key: CryptoKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(key, KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deviceKey(): Promise<CryptoKey> {
  const existing = await readKey();
  if (existing) return existing;
  const created = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await writeKey(created);
  return created;
}

export async function saveRefreshToken(token: string): Promise<void> {
  const key = await deviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  localStorage.setItem(CIPHER_KEY, JSON.stringify({
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(cipher),
  }));
}

export async function readRefreshToken(): Promise<string | null> {
  const raw = localStorage.getItem(CIPHER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { iv: string; data: string };
    const key = await deviceKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(parsed.iv)) },
      key,
      base64ToBuffer(parsed.data),
    );
    return new TextDecoder().decode(plain);
  } catch {
    localStorage.removeItem(CIPHER_KEY);
    return null;
  }
}

export function clearRefreshToken(): void {
  localStorage.removeItem(CIPHER_KEY);
}
