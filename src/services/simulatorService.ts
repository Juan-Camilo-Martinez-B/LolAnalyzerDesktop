// ============================================================
// LolAnalyzer - Game Simulator Bridge
// src/services/simulatorService.ts
//
// Lets developers test the full UI without having LoL open.
// Fires realistic game events at configurable intervals and
// publishes them through the shared eventBus.
// ============================================================

import { eventBus } from './eventBus';
import { deathsBeforeTiltAlert, loadSettings } from './settingsStore';
import type { GamePhase, ChampSelectSession } from '../types/game';
import type { TiltAlert, CoachMessage } from '../types/coach';

let simInterval: ReturnType<typeof setInterval> | null = null;
let gameTimeSec = 0;
let simDeaths = 0;

/** Simulated phases in order */
const PHASE_SEQUENCE: GamePhase[] = [
  'LOBBY', 'CHAMP_SELECT', 'IN_GAME', 'END_OF_GAME', 'NONE',
];

const MOCK_CHAMPION_IDS = [157, 64, 238, 1, 412, 22, 89, 32, 518, 235];

/** Start a full simulated game session */
export function startSimulator(): void {
  if (simInterval) stopSimulator();

  console.log('[SIM] Simulator started');
  let phaseIdx = 0;
  gameTimeSec = 0;
  simDeaths = 0;

  // Phase progression
  const advancePhase = (): void => {
    if (phaseIdx < PHASE_SEQUENCE.length) {
      eventBus.emit('game:phase_changed', { phase: PHASE_SEQUENCE[phaseIdx] });
      if (PHASE_SEQUENCE[phaseIdx] === 'CHAMP_SELECT') {
        _emitMockChampSelect();
      }
      phaseIdx++;
    }
  };

  advancePhase(); // LOBBY immediately

  setTimeout(advancePhase, 2000);  // -> CHAMP_SELECT
  setTimeout(advancePhase, 7000);  // -> IN_GAME
  setTimeout(() => {
    stopSimulator();
    advancePhase(); // -> END_OF_GAME
    setTimeout(() => {
      eventBus.emit('game:phase_changed', { phase: 'NONE' });
    }, 3000);
  }, 40000); // game lasts 40s in sim

  // Game tick (every second in sim)
  simInterval = setInterval(() => {
    gameTimeSec++;
    eventBus.emit('game:time_update', { seconds: gameTimeSec });

    // CS updates every 10 seconds
    if (gameTimeSec % 10 === 0) {
      const csRate = 6.5 + (Math.random() - 0.5) * 3;
      eventBus.emit('game:event', {
        type: 'cs_update',
        timestamp: gameTimeSec,
        value: Math.floor(csRate * (gameTimeSec / 60)),
      });
    }

    // Random kill at ~30s
    if (gameTimeSec === 30) {
      eventBus.emit('game:event', { type: 'kill', timestamp: gameTimeSec, value: 1 });
    }

    // Death at ~20s → triggers tilt scenario
    if (gameTimeSec === 20) {
      eventBus.emit('game:event', { type: 'death', timestamp: gameTimeSec, value: 1 });
      _emitMockTiltAlert(35);
    }

    // Second death at ~25s → escalate tilt
    if (gameTimeSec === 25) {
      eventBus.emit('game:event', { type: 'death', timestamp: gameTimeSec, value: 2 });
      _emitMockTiltAlert(72);
      _emitMockCoachMessage('warning', '¡Cuidado! Dos muertes en 5 minutos. Juega más seguro y prioriza el farm.');
    }

    // Positive coach message at 15s
    if (gameTimeSec === 15) {
      _emitMockCoachMessage('info', 'Dragón spawn en 45s — asegura visión en río y guarda el Destello.');
    }

    // Gold update every 20 seconds
    if (gameTimeSec % 20 === 0) {
      eventBus.emit('game:event', {
        type: 'gold_update',
        timestamp: gameTimeSec,
        value: Math.floor(200 + Math.random() * 100),
      });
    }
  }, 1000);
}

export function stopSimulator(): void {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    console.log('[SIM] Simulator stopped');
  }
}

export function isSimulatorRunning(): boolean {
  return simInterval !== null;
}

export function getSimulatorClock(): number {
  return gameTimeSec;
}

export function getSimulatorDeaths(): number {
  return simDeaths;
}

/** Jump the desktop/overlay into a phase without the Riot client. */
export function simulatePhase(phase: GamePhase): void {
  if (phase === 'IN_GAME') simDeaths = 0;
  eventBus.emit('game:phase_changed', { phase });

  if (phase === 'CHAMP_SELECT') {
    _emitMockChampSelect();
  }
  if (phase === 'NONE' || phase === 'LOBBY' || phase === 'END_OF_GAME') {
    eventBus.emit('champ_select:ended');
  }
  if (phase === 'IN_GAME') {
    eventBus.emit('game:event', { type: 'game_start', timestamp: gameTimeSec });
    eventBus.emit('overlay:state_changed', { visible: true, mode: 'compact' });
  }
}

export function advanceSimulatorClock(stepSec = 15): number {
  gameTimeSec += stepSec;
  eventBus.emit('game:time_update', { seconds: gameTimeSec });
  return gameTimeSec;
}

export function simulateKill(): void {
  eventBus.emit('game:event', { type: 'kill', timestamp: gameTimeSec, value: 1 });
}

/** A death counts toward the coach sensitivity threshold from Settings. */
export function simulateDeath(): number {
  simDeaths += 1;
  eventBus.emit('game:event', { type: 'death', timestamp: gameTimeSec, value: simDeaths });

  const needed = deathsBeforeTiltAlert(loadSettings().coachSensitivity);
  if (simDeaths >= needed) {
    _emitMockTiltAlert(Math.min(100, 36 + simDeaths * 16));
  }
  return simDeaths;
}

export function simulateTiltPing(): void {
  _emitMockTiltAlert(84);
}

export function simulateClearTilt(): void {
  eventBus.emit('coach:tilt_cleared');
}

export function simulateCoachAdvice(): void {
  _emitMockCoachMessage('info', 'Dragón en 45s — asegura visión en río y guarda el Destello.');
}

export function simulateCsTick(): number {
  if (gameTimeSec < 60) gameTimeSec = 60;
  const cs = Math.round(7.4 * (gameTimeSec / 60));
  eventBus.emit('game:time_update', { seconds: gameTimeSec });
  eventBus.emit('game:event', { type: 'cs_update', timestamp: gameTimeSec, value: cs });
  return cs;
}

export function simulateMatchEnd(win: boolean): void {
  stopSimulator();
  eventBus.emit('game:event', {
    type: 'game_end',
    timestamp: gameTimeSec,
    value: win ? 1 : 0,
    meta: { win },
  });
  eventBus.emit('game:phase_changed', { phase: 'END_OF_GAME' });
  eventBus.emit('champ_select:ended');
  if (win) {
    eventBus.emit('coach:tilt_cleared');
    _emitMockCoachMessage('positive', 'Partida ganada. El ritmo de CS se sostuvo en la fase media.');
  } else {
    _emitMockCoachMessage('warning', 'Derrota. Revisa las muertes seguidas antes del minuto 15.');
  }
}

export function resetSimulator(): void {
  stopSimulator();
  gameTimeSec = 0;
  simDeaths = 0;
  eventBus.emit('game:phase_changed', { phase: 'NONE' });
  eventBus.emit('game:time_update', { seconds: 0 });
  eventBus.emit('champ_select:ended');
  eventBus.emit('coach:tilt_cleared');
  eventBus.emit('overlay:state_changed', { csPerMin: 0, gameTime: 0, tiltAlert: null });
}

/* ─────────────────────────────────────────────────────────
   Mock emitters
───────────────────────────────────────────────────────── */
function _emitMockTiltAlert(index: number): void {
  const alert: TiltAlert = {
    level: index >= 70 ? 'high' : index >= 40 ? 'medium' : 'low',
    tiltIndex: index,
    triggerReason: 'Múltiples muertes consecutivas detectadas',
    coachMessage: 'Respira. Refocus. La partida aún se puede ganar.',
    breathingExercise: index >= 70,
    timestamp: Date.now(),
  };
  eventBus.emit('coach:tilt_alert', alert);
}

function _emitMockCoachMessage(
  severity: CoachMessage['severity'],
  message: string
): void {
  const msg: CoachMessage = {
    id: `sim_${Date.now()}`,
    timestamp: Date.now(),
    message,
    severity,
    category: severity === 'warning' ? 'tilt_alert' : 'objective_control',
  };
  eventBus.emit('coach:message', msg);
}

function _emitMockChampSelect(): void {
  const myTeam = Array.from({ length: 5 }, (_, i) => ({
    cellId: i,
    championId: MOCK_CHAMPION_IDS[i],
    assignedPosition: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][i],
    summonerId: 1000 + i,
    puuid: `mock-puuid-ally-${i}`,
  }));
  const theirTeam = Array.from({ length: 5 }, (_, i) => ({
    cellId: 5 + i,
    championId: MOCK_CHAMPION_IDS[5 + i],
    assignedPosition: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][i],
    summonerId: 2000 + i,
    puuid: `mock-puuid-enemy-${i}`,
  }));

  const session: ChampSelectSession = {
    localPlayerCellId: 2,
    actions: [],
    myTeam,
    theirTeam,
    bans: { myTeamBans: [203, 11, 157], theirTeamBans: [64, 238, 412] },
    timer: { phase: 'PLANNING', adjustedTimeLeftInPhase: 25000 },
  };
  eventBus.emit('champ_select:started', session);
}
