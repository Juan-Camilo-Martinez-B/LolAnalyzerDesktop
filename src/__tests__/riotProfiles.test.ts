import { describe, expect, it } from 'vitest';
import { ALL_PROFILES, chooseActiveProfile, profileLabel } from '../services/riotProfiles';

const base = { choice: null, linked: null, clientPuuid: null, fallback: null, known: ['main', 'alt'] };

describe('active League profile', () => {
  it('follows the account open in the client when nothing is linked', () => {
    expect(chooseActiveProfile({ ...base, clientPuuid: 'alt', fallback: 'main' })).toBe('alt');
  });

  it('keeps the last opened profile while the client is closed', () => {
    expect(chooseActiveProfile({ ...base, fallback: 'main' })).toBe('main');
  });

  it('stays on the linked Riot ID even if another account is open', () => {
    expect(chooseActiveProfile({ ...base, linked: 'main', clientPuuid: 'alt' })).toBe('main');
  });

  it('lets the player pick a profile or all of them', () => {
    expect(chooseActiveProfile({ ...base, choice: 'alt', linked: 'main' })).toBe('alt');
    expect(chooseActiveProfile({ ...base, choice: ALL_PROFILES, linked: 'main' })).toBe(ALL_PROFILES);
  });

  it('drops a pick that no longer exists and shows every game without profiles', () => {
    expect(chooseActiveProfile({ ...base, choice: 'gone', clientPuuid: 'alt' })).toBe('alt');
    expect(chooseActiveProfile({ ...base, known: [] })).toBe(ALL_PROFILES);
  });

  it('names profiles by Riot ID', () => {
    expect(profileLabel({ puuid: 'abcdef123', gameName: 'XTHZC7', tagLine: 'LAN' })).toBe('XTHZC7#LAN');
    expect(profileLabel({ puuid: 'abcdef123', gameName: null, tagLine: null })).toBe('Perfil abcdef');
  });
});
