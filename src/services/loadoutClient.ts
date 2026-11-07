// ============================================================
// LolAnalyzer - Runes and item sets for champion select
// src/services/loadoutClient.ts
//
// The backend reads OP.GG meta data and talks to the League client
// (lockfile, 127.0.0.1 only). This window never sees client credentials.
// ============================================================

import { apiRequest } from './backendAuth';

export interface RunePerk {
  id: number;
  name: string;
  iconPath: string;
}

export interface RunePage {
  source: 'opgg' | 'client';
  label: string;
  position: string | null;
  primaryStyleId: number;
  subStyleId: number;
  perks: RunePerk[];
  summonerSpellIds: number[];
  isDefaultPosition: boolean;
  pickRate?: number;
}

export interface ItemBlock {
  title: string;
  itemIds: number[];
}

export interface Loadout {
  clientConnected: boolean;
  championId: number;
  championName?: string | null;
  position?: string | null;
  opponent: { id: number; name: string } | null;
  source: 'opgg' | 'client' | 'none';
  runePages: RunePage[];
  itemBlocks: ItemBlock[];
  summonerSpellIds?: number[];
  skillOrder?: string[];
  tip?: string | null;
  notice?: string | null;
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

export function fetchLoadout(championId: number, position?: string): Promise<Loadout> {
  const query = new URLSearchParams({ champion_id: String(championId) });
  if (position && position !== 'FILL') query.set('position', position);
  return apiRequest<Loadout>(`/api/champ-select/loadout?${query.toString()}`);
}

export function importRunes(championName: string, page: RunePage): Promise<unknown> {
  return apiRequest('/api/champ-select/loadout/runes', {
    method: 'POST',
    body: JSON.stringify({
      champion_name: championName,
      primary_style_id: page.primaryStyleId,
      sub_style_id: page.subStyleId,
      perk_ids: page.perks.map((perk) => perk.id),
    }),
  });
}

/** Sends [D, F]; the order is kept, so Flash lands on the key the player chose. */
export function importSpells(spellIds: [number, number]): Promise<unknown> {
  return apiRequest('/api/champ-select/loadout/spells', {
    method: 'POST',
    body: JSON.stringify({ spell_ids: spellIds }),
  });
}

export function importItems(championId: number, championName: string, blocks: ItemBlock[]): Promise<unknown> {
  return apiRequest('/api/champ-select/loadout/items', {
    method: 'POST',
    body: JSON.stringify({
      champion_id: championId,
      champion_name: championName,
      blocks: blocks.map((block) => ({ title: block.title, item_ids: block.itemIds })),
    }),
  });
}

/** Same champion and opponent imported once per session, even if the card remounts. */
const autoImported = new Set<string>();

export function autoImportKey(loadout: Loadout): string {
  return `${loadout.championId}|${loadout.opponent?.id ?? 0}|${loadout.source}`;
}

export function claimAutoImport(key: string): boolean {
  if (autoImported.has(key)) return false;
  autoImported.add(key);
  return true;
}
