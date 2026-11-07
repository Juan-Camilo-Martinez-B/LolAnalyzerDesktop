import { describe, expect, it } from 'vitest';
import { shouldOpenChampSelect } from '../hooks/useClientPhase';
import { mapGameflowPhase } from '../services/lcuService';

describe('auto open champion select', () => {
  it('opens once when the client enters champion select', () => {
    expect(shouldOpenChampSelect('LOBBY', 'CHAMP_SELECT', true)).toBe(true);
    expect(shouldOpenChampSelect(null, 'CHAMP_SELECT', true)).toBe(true);
    expect(shouldOpenChampSelect('CHAMP_SELECT', 'CHAMP_SELECT', true)).toBe(false);
  });

  it('stays put for other phases or when switched off', () => {
    expect(shouldOpenChampSelect('CHAMP_SELECT', 'IN_GAME', true)).toBe(false);
    expect(shouldOpenChampSelect('LOBBY', 'CHAMP_SELECT', false)).toBe(false);
  });

  it('maps client gameflow names to app phases', () => {
    expect(mapGameflowPhase('ChampSelect')).toBe('CHAMP_SELECT');
    expect(mapGameflowPhase('ReadyCheck')).toBe('MATCHMAKING');
    expect(mapGameflowPhase('InProgress')).toBe('IN_GAME');
    expect(mapGameflowPhase('Something new')).toBe('NONE');
  });
});
