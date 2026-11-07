import { describe, expect, it } from 'vitest';
import {
  createMapperState,
  mapLiveClientSnapshot,
  type LiveClientSnapshot,
} from './liveEventMapper.ts';

function snapshot(overrides: Partial<LiveClientSnapshot> = {}): LiveClientSnapshot {
  return {
    activePlayer: {
      riotId: 'Local#LAN',
      riotIdGameName: 'Local',
      riotIdTagLine: 'LAN',
      currentGold: 500,
    },
    allPlayers: [
      { riotIdGameName: 'Local', riotIdTagLine: 'LAN', scores: { creepScore: 40 } },
      { summonerName: 'Enemy', scores: { creepScore: 12 } },
    ],
    gameData: { gameTime: 180 },
    events: { Events: [] },
    ...overrides,
  };
}

describe('mapLiveClientSnapshot', () => {
  it('maps the clock, gold, and creep score once', () => {
    const state = createMapperState();
    const first = mapLiveClientSnapshot(snapshot(), state);
    expect(first.seconds).toBe(180);
    expect(first.events.map((event) => event.type)).toEqual(['cs_update', 'gold_update']);
    expect(first.events[0]).toMatchObject({ type: 'cs_update', timestamp: 180, value: 40 });
    expect(first.events[1]).toMatchObject({ type: 'gold_update', value: 500 });

    const second = mapLiveClientSnapshot(snapshot(), state);
    expect(second.events).toEqual([]);
  });

  it('classifies champion kills for the local player and ignores repeats', () => {
    const state = createMapperState();
    const data = snapshot({
      events: {
        Events: [
          { EventID: 1, EventName: 'GameStart', EventTime: 0 },
          { EventID: 2, EventName: 'ChampionKill', EventTime: 80, KillerName: 'Local', VictimName: 'Enemy' },
          { EventID: 3, EventName: 'ChampionKill', EventTime: 90, KillerName: 'Enemy', VictimName: 'Local#LAN' },
          { EventID: 4, EventName: 'ChampionKill', EventTime: 100, KillerName: 'Ally', VictimName: 'Enemy', Assisters: ['Local'] },
          { EventID: 5, EventName: 'GameEnd', EventTime: 200 },
        ],
      },
    });
    const mapped = mapLiveClientSnapshot(data, state);
    expect(mapped.events.map((event) => event.type)).toEqual([
      'game_start',
      'kill',
      'death',
      'assist',
      'game_end',
      'cs_update',
      'gold_update',
    ]);
    expect(mapLiveClientSnapshot(data, state).events.map((event) => event.type)).toEqual([]);
  });
});
