import { describe, expect, it } from 'vitest';
import { clientJustConnected } from '../hooks/useClientPhase';
import { adviceSourceLabel, visibleSourceTotals } from '../services/adviceSources';

describe('client connection', () => {
  it('reports the client once when it opens after the app', () => {
    expect(clientJustConnected(false, true)).toBe(true);
    expect(clientJustConnected(true, true)).toBe(false);
  });

  it('reports a client that was already open on the first answer', () => {
    expect(clientJustConnected(null, true)).toBe(true);
  });

  it('does not report a closed client', () => {
    expect(clientJustConnected(null, false)).toBe(false);
    expect(clientJustConnected(true, false)).toBe(false);
  });
});

describe('coach advice sources', () => {
  it('names Groq tips and falls back to the local engine', () => {
    expect(adviceSourceLabel('groq')).toBe('Groq');
    expect(adviceSourceLabel('rules')).toBe('Lectura en vivo');
    expect(adviceSourceLabel('unknown')).toBe('Motor local');
  });

  it('hides Gemini unless old tips used it', () => {
    const totals = visibleSourceTotals({ groq: 3, rules: 5, heuristic: 1, gemini: 0 });
    expect(totals.map((row) => row.label)).toEqual(['Lectura en vivo', 'Groq', 'Motor local']);
    expect(visibleSourceTotals({ gemini: 2 }).some((row) => row.source === 'gemini')).toBe(true);
  });
});
