// ============================================================
// LolAnalyzer - Runes and item sets for champion select
// src/services/loadoutClient.ts
//
// The backend talks to the League client (lockfile, 127.0.0.1 only).
// This window never sees the client credentials.
// ============================================================

import { apiRequest } from './backendAuth';

export interface RunePerk {
  id: number;
  name: string;
  iconPath: string;
}

export interface RecommendedRunePage {
  position: string | null;
  primaryStyleId: number;
  subStyleId: number;
  perks: RunePerk[];
  summonerSpellIds: number[];
  isDefaultPosition: boolean;
}

export interface Loadout {
  clientConnected: boolean;
  championId: number;
  championName: string;
  runePages: RecommendedRunePage[];
  build: { games: number; itemIds: number[] };
}

export const RUNE_STYLE_NAMES: Record<number, string> = {
  8000: 'Precisión',
  8100: 'Dominación',
  8200: 'Brujería',
  8300: 'Inspiración',
  8400: 'Valor',
};

const LCU_ASSET_PREFIX = '/lol-game-data/assets/v1/';

/** The client's icon path, served from Data Dragon so no client credentials are needed. */
export function runeIconUrl(iconPath: string): string | null {
  if (!iconPath.startsWith(LCU_ASSET_PREFIX)) return null;
  return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath.slice(LCU_ASSET_PREFIX.length)}`;
}

export function fetchLoadout(championId: number, championName: string, position?: string): Promise<Loadout> {
  const query = new URLSearchParams({ champion_id: String(championId), champion_name: championName });
  if (position && position !== 'FILL') query.set('position', position);
  return apiRequest<Loadout>(`/api/champ-select/loadout?${query.toString()}`);
}

export function importRunes(championName: string, page: RecommendedRunePage): Promise<{ spellsApplied: boolean }> {
  return apiRequest('/api/champ-select/loadout/runes', {
    method: 'POST',
    body: JSON.stringify({
      champion_name: championName,
      primary_style_id: page.primaryStyleId,
      sub_style_id: page.subStyleId,
      perk_ids: page.perks.map((perk) => perk.id),
      summoner_spell_ids: page.summonerSpellIds.slice(0, 2),
    }),
  });
}

export function importItems(championId: number, championName: string, itemIds: number[], games: number): Promise<unknown> {
  return apiRequest('/api/champ-select/loadout/items', {
    method: 'POST',
    body: JSON.stringify({ champion_id: championId, champion_name: championName, item_ids: itemIds, games }),
  });
}
