// ============================================================
// LolAnalyzer - Summoner spell slots
// src/services/spellOrder.ts
// ============================================================

import type { FlashKey } from './settingsStore';

export const FLASH_ID = 4;

/** Data Dragon image keys and Spanish names for the spells champion select offers. */
export const SUMMONER_SPELLS: Record<number, { key: string; name: string }> = {
  1: { key: 'SummonerBoost', name: 'Limpiar' },
  3: { key: 'SummonerExhaust', name: 'Extenuación' },
  4: { key: 'SummonerFlash', name: 'Destello' },
  6: { key: 'SummonerHaste', name: 'Fantasmal' },
  7: { key: 'SummonerHeal', name: 'Curar' },
  11: { key: 'SummonerSmite', name: 'Castigo' },
  12: { key: 'SummonerTeleport', name: 'Teleportar' },
  13: { key: 'SummonerMana', name: 'Claridad' },
  14: { key: 'SummonerDot', name: 'Prender' },
  21: { key: 'SummonerBarrier', name: 'Barrera' },
  32: { key: 'SummonerSnowball', name: 'Marca' },
};

/**
 * Puts Flash on the chosen key and returns [D, F].
 * Builds without Flash keep their order. Null when there are not two spells.
 */
export function orderSpells(spellIds: number[], flashKey: FlashKey): [number, number] | null {
  const [first, second] = spellIds;
  if (!first || !second || first === second) return null;
  if (first !== FLASH_ID && second !== FLASH_ID) return [first, second];
  const other = first === FLASH_ID ? second : first;
  return flashKey === 'D' ? [FLASH_ID, other] : [other, FLASH_ID];
}
