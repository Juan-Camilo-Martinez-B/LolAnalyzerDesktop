import { describe, expect, it } from 'vitest';
import { AssetResolver } from '../services/assetResolver';

const CDN = 'https://ddragon.leagueoflegends.com/cdn';

describe('AssetResolver', () => {
  const resolver = new AssetResolver();

  it('starts on the pinned Data Dragon version', () => {
    expect(resolver.getVersion()).toBe('14.5.1');
  });

  it('builds a champion square and applies the version', () => {
    resolver.setVersion('15.1.1');
    expect(resolver.getChampionSquare('Ahri')).toBe(`${CDN}/15.1.1/img/champion/Ahri.png`);
    resolver.setVersion('14.5.1');
  });

  it('maps special champion names to Data Dragon keys', () => {
    expect(resolver.getChampionSquare('wukong')).toContain('/MonkeyKing.png');
    expect(resolver.getChampionSquare("Kai'Sa")).toContain('/Kaisa.png');
    expect(resolver.getChampionSquare("Kha'Zix")).toContain('/Khazix.png');
    expect(resolver.getChampionSquare('Nunu & Willump')).toContain('/Nunu.png');
  });

  it('uses a placeholder when the champion is unknown', () => {
    expect(resolver.getChampionSquare('')).toContain('champion-icons/-1.png');
    expect(resolver.getChampionSquare('Unknown')).toContain('champion-icons/-1.png');
  });

  it('builds splash and loading art with the skin index', () => {
    expect(resolver.getChampionSplash('Ahri')).toBe(
      'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg',
    );
    expect(resolver.getChampionLoadingSplash('Ahri', 2)).toContain('/Ahri_2.jpg');
  });

  it('builds item icons and a placeholder for an empty slot', () => {
    expect(resolver.getItemIcon(3031)).toContain('/img/item/3031.png');
    expect(resolver.getItemIcon(0)).toContain('item-icons/0.png');
    expect(resolver.getItemIcon('0')).toContain('item-icons/0.png');
  });

  it('normalizes role emblems', () => {
    expect(resolver.getRoleEmblem('ADC')).toContain('icon-position-bottom.png');
    expect(resolver.getRoleEmblem('support')).toContain('icon-position-utility.png');
    expect(resolver.getRoleEmblem('JUNGLE')).toContain('icon-position-jungle.png');
    expect(resolver.getRoleEmblem('mystery')).toContain('icon-position-middle.png');
  });

  it('lowercases the ranked emblem', () => {
    expect(resolver.getRankEmblem('CHALLENGER')).toContain('/challenger.png');
  });

  it('builds a summoner spell icon', () => {
    expect(resolver.getSummonerSpellIcon('SummonerFlash')).toContain('/img/spell/SummonerFlash.png');
  });
});
