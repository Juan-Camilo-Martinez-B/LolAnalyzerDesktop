// ============================================================
// LolAnalyzer - Overwolf Background Service Coordinator
// src/background/backgroundMain.ts
// ============================================================

import { eventBus } from '../services/eventBus';
import { overwolfService } from '../services/overwolfService';
import { startLcuPolling } from '../services/lcuService';
import { deathsBeforeTiltAlert, loadSettings } from '../services/settingsStore';
import { backgroundTiltIndex, tiltLevelForSensitivity } from '../services/tiltCalculations';
import type { GamePhase } from '../types/game';

console.log('[LolAnalyzer] Background service worker initialized.');

class BackgroundCoordinator {
  private currentPhase: GamePhase = 'NONE';
  private deathsThisGame = 0;

  public async initialize() {
    console.log('[BackgroundCoordinator] Starting services...');

    // 1. Subscribe to Overwolf Game Events if running inside Overwolf
    if (overwolfService.isOverwolfAvailable()) {
      overwolfService.registerGameEvents();
    } else {
      console.log('[BackgroundCoordinator] Running in browser mode - LCU and Overwolf events simulated.');
    }

    // 2. Start LCU Polling loop for local Riot Client REST API
    startLcuPolling(2000);

    // 3. Listen for Game Phase changes and manage window visibility
    eventBus.on('game:phase_changed', ({ phase }) => {
      this.handlePhaseChange(phase as GamePhase);
    });

    // 4. Listen for in-game kills/deaths to trigger overlay alerts
    eventBus.on('game:event', (event) => {
      console.log('[BackgroundCoordinator] Game event broadcast:', event);
      if (event.type !== 'death') return;

      this.deathsThisGame += 1;
      const sensitivity = loadSettings().coachSensitivity;
      const needed = deathsBeforeTiltAlert(sensitivity);
      if (this.deathsThisGame < needed) return;

      const level = tiltLevelForSensitivity(sensitivity);
      eventBus.emit('coach:tilt_alert', {
        level,
        tiltIndex: backgroundTiltIndex(sensitivity),
        triggerReason: `${this.deathsThisGame} muerte${this.deathsThisGame === 1 ? '' : 's'} en la partida`,
        coachMessage: 'Mantén la calma. Juega defensivo cerca de tu torre.',
        timestamp: Date.now(),
      });
    });
  }

  private async handlePhaseChange(newPhase: GamePhase) {
    if (this.currentPhase === newPhase) return;
    console.log(`[BackgroundCoordinator] Game Phase transitioning: ${this.currentPhase} -> ${newPhase}`);
    if (newPhase === 'IN_GAME') this.deathsThisGame = 0;
    this.currentPhase = newPhase;

    if (!overwolfService.isOverwolfAvailable()) return;

    if (newPhase === 'IN_GAME' || newPhase === 'CHAMP_SELECT') {
      console.log('[BackgroundCoordinator] Auto-opening Overlay window...');
      await overwolfService.obtainDeclaredWindow('overlay');
      await overwolfService.restoreWindow('overlay');
    } else if (newPhase === 'END_OF_GAME' || newPhase === 'NONE') {
      console.log('[BackgroundCoordinator] Restoring Desktop window...');
      await overwolfService.restoreWindow('desktop');
    }
  }
}

const coordinator = new BackgroundCoordinator();
coordinator.initialize().catch((err) => {
  console.error('[BackgroundCoordinator] Initialization failed:', err);
});
