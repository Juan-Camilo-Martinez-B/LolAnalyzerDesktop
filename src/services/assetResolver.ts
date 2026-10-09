// ============================================================
// LolAnalyzer - Riot DataDragon & Asset Resolver
// src/services/assetResolver.ts
// ============================================================

const DEFAULT_DDRAGON_VERSION = '16.20.1';
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn';

export class AssetResolver {
  private version: string = DEFAULT_DDRAGON_VERSION;

  public setVersion(ver: string) {
    this.version = ver;
  }

  public getVersion(): string {
    return this.version;
  }

  /**
   * Champion Square Icon
   * @param championName Name or Key (e.g. "Ahri", "MonkeyKing" for Wukong)
   */
  public getChampionSquare(championName: string): string {
    if (!championName || championName === 'Unknown') {
      return 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
    }
    // Handle special cases
    const formatted = this.formatChampionName(championName);
    return `${DDRAGON_BASE}/${this.version}/img/champion/${formatted}.png`;
  }

  /**
   * Champion Centered Loading Splash Art
   */
  public getChampionLoadingSplash(championName: string, skinNum: number = 0): string {
    const formatted = this.formatChampionName(championName);
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${formatted}_${skinNum}.jpg`;
  }

  /**
   * Champion Full Centered Splash
   */
  public getChampionSplash(championName: string, skinNum: number = 0): string {
    const formatted = this.formatChampionName(championName);
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${formatted}_${skinNum}.jpg`;
  }

  /**
   * Item Icon by Item ID
   */
  public getItemIcon(itemId: number | string): string {
    if (!itemId || itemId === 0 || itemId === '0') {
      return 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/0.png';
    }
    return `${DDRAGON_BASE}/${this.version}/img/item/${itemId}.png`;
  }

  /**
   * Summoner profile icon. Newer icons only exist on the current Data Dragon patch.
   */
  public getProfileIcon(iconId: number, version = this.version): string {
    const id = Number.isInteger(iconId) && iconId >= 0 ? iconId : 29;
    return `${DDRAGON_BASE}/${version}/img/profileicon/${id}.png`;
  }

  /**
   * Summoner Spell Icon by Spell Key or ID
   */
  public getSummonerSpellIcon(spellName: string): string {
    return `${DDRAGON_BASE}/${this.version}/img/spell/${spellName}.png`;
  }

  /**
   * Role / Position Emblem SVG (Top, Jungle, Mid, Bottom, Utility)
   */
  public getRoleEmblem(role: string): string {
    const norm = role.toLowerCase();
    const roleMap: Record<string, string> = {
      top: 'top',
      jungle: 'jungle',
      jug: 'jungle',
      mid: 'middle',
      middle: 'middle',
      bot: 'bottom',
      bottom: 'bottom',
      adc: 'bottom',
      support: 'utility',
      utility: 'utility',
      sup: 'utility',
    };
    const key = roleMap[norm] || 'middle';
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-${key}.png`;
  }

  /**
   * Ranked Tier Emblem (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
   */
  public getRankEmblem(tier: string): string {
    const norm = tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-emblems/${norm}.png`;
  }

  /**
   * Formats champion names for DataDragon conventions
   */
  private formatChampionName(name: string): string {
    const nameMap: Record<string, string> = {
      wukong: 'MonkeyKing',
      wukongking: 'MonkeyKing',
      'leblanc': 'Leblanc',
      'khazix': 'Khazix',
      'renata glasc': 'Renata',
      'renata': 'Renata',
      'nunu & willump': 'Nunu',
      'nunu': 'Nunu',
      'velkoz': 'Velkoz',
      'cho\'gath': 'Chogath',
      'chogath': 'Chogath',
      'kai\'sa': 'Kaisa',
      'kaisa': 'Kaisa',
      'kha\'zix': 'Khazix',
      'rek\'sai': 'Reksai',
      'reksai': 'Reksai',
      'bel\'veth': 'Belveth',
      'belveth': 'Belveth',
      "k'sante": 'Ksante',
      'ksante': 'Ksante',
    };

    const lower = name.toLowerCase().trim();
    if (nameMap[lower]) return nameMap[lower];

    // Remove spaces, apostrophes, dots
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, (str) => str.toUpperCase());
  }
}

export const assetResolver = new AssetResolver();

let versionRequest: Promise<string> | null = null;

/** Loads the newest Data Dragon patch once and keeps the previous one if the request fails. */
export function ensureDdragonVersion(): Promise<string> {
  if (!versionRequest) {
    versionRequest = fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((response) => {
        if (!response.ok) throw new Error('versions unavailable');
        return response.json() as Promise<unknown>;
      })
      .then((versions) => {
        const latest = Array.isArray(versions)
          ? versions.find((item) => typeof item === 'string' && /^\d+\.\d+\.\d+$/.test(item))
          : null;
        if (typeof latest === 'string') assetResolver.setVersion(latest);
        return assetResolver.getVersion();
      })
      .catch(() => assetResolver.getVersion());
  }
  return versionRequest;
}
