// ============================================================
// LolAnalyzer - Game Simulator Bridge
// src/services/simulatorService.ts
//
// Lets developers test the full UI without having LoL open.
// Fires realistic game events at configurable intervals and
// publishes them through the shared eventBus.
// ============================================================

import { eventBus } from './eventBus';
import type { GamePhase, ChampSelectSession } from '../types/game';
import type { TiltAlert, CoachMessage } from '../types/coach';

let simInterval: ReturnType<typeof setInterval> | null = null;
let gameTimeSec = 0;

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
