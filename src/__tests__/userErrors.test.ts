import { describe, expect, it } from 'vitest';
import { toUserMessage } from '../services/userErrors';

describe('user facing errors', () => {
  it('replaces a bare status and a downed server', () => {
    expect(toUserMessage(404, 'Not Found')).toBe('No encontramos lo que buscabas.');
    expect(toUserMessage(0, null, 'network')).toBe('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.');
    expect(toUserMessage(500, 'Internal Server Error')).toBe('Ocurrió un error. Intenta nuevamente más tarde.');
  });

  it('keeps a sentence the player can act on', () => {
    expect(toUserMessage(409, 'Ya existe una cuenta con ese correo.')).toBe('Ya existe una cuenta con ese correo.');
    expect(toUserMessage(401, 'Incorrect email or password.')).toBe('El correo o la contraseña no coinciden.');
  });
});
