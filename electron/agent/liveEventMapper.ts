export type MappedEventType =
  | 'kill'
  | 'death'
  | 'assist'
  | 'objective'
  | 'cs_update'
  | 'gold_update'
  | 'game_start'
  | 'game_end';

export interface MappedGameEvent {
  type: MappedEventType;
  timestamp: number;
  value?: number;
  meta?: Record<string, unknown>;
}

export interface LivePlayer {
  summonerName?: string;
  riotId?: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
  scores?: { creepScore?: number };
}

export interface LiveClientSnapshot {
  activePlayer?: {
    summonerName?: string;
    riotId?: string;
    riotIdGameName?: string;
    riotIdTagLine?: string;
    currentGold?: number;
  };
  allPlayers?: LivePlayer[];
  events?: {
    Events?: Array<{
      EventID?: number;
      EventName?: string;
      EventTime?: number;
      KillerName?: string;
      VictimName?: string;
      Assisters?: string[];
    }>;
  };
  gameData?: { gameTime?: number };
}

export interface MapperState {
  seenEventIds: Set<string>;
  lastCreepScore: number | null;
  lastGold: number | null;
}

export interface MappedLiveUpdate {
  seconds: number | null;
  events: MappedGameEvent[];
}

export function createMapperState(): MapperState {
  return { seenEventIds: new Set(), lastCreepScore: null, lastGold: null };
}

function addIdentity(target: Set<string>, value: string | undefined): void {
  if (!value) return;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return;
  target.add(trimmed);
  const hash = trimmed.indexOf('#');
  if (hash > 0) target.add(trimmed.slice(0, hash));
}

export function localIdentities(snapshot: LiveClientSnapshot): string[] {
  const names = new Set<string>();
  const player = snapshot.activePlayer;
  if (!player) return [];
  addIdentity(names, player.summonerName);
  addIdentity(names, player.riotId);
  addIdentity(names, player.riotIdGameName);
  if (player.riotIdGameName && player.riotIdTagLine) {
    addIdentity(names, `${player.riotIdGameName}#${player.riotIdTagLine}`);
  }
  return [...names];
}

function matchesLocal(candidate: string | undefined, local: string[]): boolean {
  if (!candidate) return false;
  const value = candidate.trim().toLowerCase();
  if (!value) return false;
  if (local.includes(value)) return true;
  const hash = value.indexOf('#');
  return hash > 0 && local.includes(value.slice(0, hash));
}

function localCreepScore(snapshot: LiveClientSnapshot, local: string[]): number | null {
  for (const player of snapshot.allPlayers ?? []) {
    const names = new Set<string>();
    addIdentity(names, player.summonerName);
    addIdentity(names, player.riotId);
    addIdentity(names, player.riotIdGameName);
    if (player.riotIdGameName && player.riotIdTagLine) {
      addIdentity(names, `${player.riotIdGameName}#${player.riotIdTagLine}`);
    }
    const isLocal = [...names].some((name) => local.includes(name));
    if (!isLocal) continue;
    const score = player.scores?.creepScore;
    if (typeof score === 'number' && Number.isFinite(score)) return score;
  }
  return null;
}

export function mapLiveClientSnapshot(snapshot: LiveClientSnapshot, state: MapperState): MappedLiveUpdate {
  const events: MappedGameEvent[] = [];
  const seconds = typeof snapshot.gameData?.gameTime === 'number' && Number.isFinite(snapshot.gameData.gameTime)
    ? snapshot.gameData.gameTime
    : null;
  const clock = seconds ?? 0;
  const local = localIdentities(snapshot);

  for (const raw of snapshot.events?.Events ?? []) {
    const name = raw.EventName ?? '';
    const key = raw.EventID != null ? `id:${raw.EventID}` : `${name}:${raw.EventTime ?? ''}`;
    if (!name || state.seenEventIds.has(key)) continue;
    state.seenEventIds.add(key);
    const timestamp = typeof raw.EventTime === 'number' ? raw.EventTime : clock;
    if (name === 'GameStart') {
      events.push({ type: 'game_start', timestamp });
      continue;
    }
    if (name === 'GameEnd') {
      events.push({ type: 'game_end', timestamp });
      continue;
    }
    if (name !== 'ChampionKill' || local.length === 0) continue;
    if (matchesLocal(raw.VictimName, local)) {
      events.push({ type: 'death', timestamp, value: 1 });
    } else if (matchesLocal(raw.KillerName, local)) {
      events.push({ type: 'kill', timestamp, value: 1 });
    } else if ((raw.Assisters ?? []).some((name) => matchesLocal(name, local))) {
      events.push({ type: 'assist', timestamp, value: 1 });
    }
  }

  const creepScore = localCreepScore(snapshot, local);
  if (creepScore != null && creepScore !== state.lastCreepScore) {
    state.lastCreepScore = creepScore;
    events.push({ type: 'cs_update', timestamp: clock, value: creepScore });
  }

  const gold = snapshot.activePlayer?.currentGold;
  if (typeof gold === 'number' && Number.isFinite(gold) && gold !== state.lastGold) {
    state.lastGold = gold;
    events.push({ type: 'gold_update', timestamp: clock, value: gold });
  }

  return { seconds, events };
}
