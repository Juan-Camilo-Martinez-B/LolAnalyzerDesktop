/**
 * Turns HTTP and network failures into a sentence the player can act on.
 * The backend already translates known cases. This still covers a server
 * that is down, a timeout, or an older English detail.
 */

const GENERIC = 'Ocurrió un error. Intenta nuevamente más tarde.';

const KNOWN: Record<string, string> = {
  'an account with this email address already exists.': 'Ya existe una cuenta con ese correo.',
  'incorrect email or password.': 'El correo o la contraseña no coinciden.',
  'recovery answers must use a known champion and rank.': 'Elige un campeón y un rango de la lista.',
  'no riot account is linked yet.': 'Todavía no hay una cuenta de Riot vinculada. Hazlo en Ajustes.',
  'unsupported region.': 'Esa región no está disponible.',
  'that riot account is already linked to another user.': 'Esa cuenta de Riot ya está vinculada a otro usuario.',
  'riot account or resource was not found.': 'No encontramos ese Riot ID. Revisa el nombre y la etiqueta.',
  'riot api rate limit reached. try again shortly.': 'Riot está recibiendo demasiadas consultas. Intenta de nuevo en unos minutos.',
  'riot api is temporarily unavailable.': 'No pudimos consultar Riot en este momento. Intenta de nuevo más tarde.',
  'incorrect current password.': 'La contraseña actual no coincide.',
  'not found': 'No encontramos lo que buscabas.',
  'no hay conexión con el backend.': 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.',
  'el backend tardó demasiado en responder.': 'La respuesta tardó demasiado. Intenta nuevamente más tarde.',
};

const TECHNICAL = /traceback|exception|bearer|puuid|token|api[_ ]?key|\bapi\b|backend|error\s*\d{3}|\b(401|403|404|422|500|502|503)\b|not found|unauthorized|forbidden|internal server/i;

const FALLBACK: Record<number, string> = {
  400: 'No pudimos completar esa acción. Revisa los datos e inténtalo de nuevo.',
  401: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para hacer eso.',
  404: 'No encontramos lo que buscabas.',
  409: 'Esa información ya está en uso.',
  422: 'Revisa los datos e inténtalo de nuevo.',
  429: 'Hay demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
};

function extract(detail: unknown): string {
  if (typeof detail === 'string') return detail.trim();
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return (first.msg || '').trim();
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === 'string') return message.trim();
  }
  return '';
}

function isFriendly(text: string): boolean {
  if (!text || TECHNICAL.test(text)) return false;
  return /[áéíóúñ¿¡]/i.test(text) || (text.endsWith('.') && text.includes(' '));
}

export function toUserMessage(status: number, detail: unknown, kind?: 'network' | 'timeout'): string {
  if (kind === 'timeout') return 'La respuesta tardó demasiado. Intenta nuevamente más tarde.';
  if (kind === 'network') return 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.';
  const text = extract(detail);
  const known = KNOWN[text.toLowerCase()];
  if (known) return known;
  if (text.toLowerCase().startsWith('match record #')) return 'No encontramos esa partida.';
  if (isFriendly(text)) return text;
  if (status >= 500 || status === 0) return GENERIC;
  return FALLBACK[status] ?? 'No pudimos completar esa acción. Intenta de nuevo.';
}

export function messageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.name === 'BackendError') return error.message;
  if (error instanceof Error && error.message) return toUserMessage(0, error.message);
  return GENERIC;
}

const APP_ERROR_EVENT = 'lol-analyzer:app-error';

let visibleMessage = '';
let silencedMessage = '';
let silencedUntil = 0;

export function publishAppError(error: unknown): void {
  const message = messageFromUnknown(error);
  if (!message || message === visibleMessage) return;
  if (message === silencedMessage && Date.now() < silencedUntil) return;
  visibleMessage = message;
  window.dispatchEvent(new CustomEvent(APP_ERROR_EVENT, { detail: message }));
}

export function dismissAppError(message: string): void {
  if (visibleMessage === message) visibleMessage = '';
  silencedMessage = message;
  silencedUntil = Date.now() + 30000;
}

export function subscribeAppError(listener: (message: string) => void): () => void {
  const handler = (event: Event) => {
    const message = (event as CustomEvent<string>).detail;
    if (message) listener(message);
  };
  window.addEventListener(APP_ERROR_EVENT, handler);
  return () => window.removeEventListener(APP_ERROR_EVENT, handler);
}
