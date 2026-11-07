import { IpcChannel } from '../ipcChannels.js';
import { isCertificateError, fetchAllGameData } from './liveClient.js';
import {
  createMapperState,
  mapLiveClientSnapshot,
  type LiveClientSnapshot,
  type MapperState,
} from './liveEventMapper.js';

type Emit = (channel: string, payload: unknown) => void;

function isSnapshot(value: unknown): value is LiveClientSnapshot {
  return typeof value === 'object' && value !== null;
}

/**
 * Polls the local Live Client API. Certificate or port failures stay inside the
 * loop so Electron still starts and the in-app simulator remains usable.
 */
export class GameDataAgent {
  private timer: NodeJS.Timeout | null = null;
  private inGame = false;
  private misses = 0;
  private allowUnverifiedLocalCert = false;
  private loggedCert = false;
  private loggedDown = false;
  private sawGameEnd = false;
  private state: MapperState = createMapperState();

  constructor(private readonly emit: Emit) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 1000);
    void this.tick();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private leaveGame(): void {
    if (!this.inGame) return;
    this.inGame = false;
    this.state = createMapperState();
    if (!this.sawGameEnd) {
      this.emit(IpcChannel.gameEvent, { type: 'game_end', timestamp: 0 });
    }
    this.sawGameEnd = false;
    this.emit(IpcChannel.gamePhase, { phase: 'END_OF_GAME' });
    this.emit(IpcChannel.playerStats, null);
  }

  private async tick(): Promise<void> {
    try {
      const payload = await fetchAllGameData(this.allowUnverifiedLocalCert);
      if (!isSnapshot(payload)) return;
      this.misses = 0;
      this.loggedDown = false;
      if (!this.inGame) {
        this.inGame = true;
        this.sawGameEnd = false;
        this.emit(IpcChannel.gamePhase, { phase: 'IN_GAME' });
      }
      const mapped = mapLiveClientSnapshot(payload, this.state);
      if (mapped.seconds != null) {
        this.emit(IpcChannel.gameTime, { seconds: mapped.seconds });
      }
      for (const event of mapped.events) {
        this.emit(IpcChannel.gameEvent, event);
        if (event.type === 'game_end') this.sawGameEnd = true;
      }
      if (mapped.player) {
        this.emit(IpcChannel.playerStats, mapped.player);
      }
    } catch (error) {
      if (isCertificateError(error) && !this.allowUnverifiedLocalCert) {
        this.allowUnverifiedLocalCert = true;
        if (!this.loggedCert) {
          this.loggedCert = true;
          console.warn('[live-client] el certificado de 127.0.0.1:2999 no verificó; se reintenta solo contra ese puerto');
        }
        return;
      }
      this.misses += 1;
      if (this.inGame && this.misses >= 3) {
        this.leaveGame();
        return;
      }
      if (!this.inGame && !this.loggedDown && this.misses === 1) {
        this.loggedDown = true;
        console.info('[live-client] 127.0.0.1:2999 no responde; el simulador de desarrollo sigue disponible');
      }
    }
  }
}
