import type { BrowserWindow } from 'electron';
import { IpcChannel } from './ipcChannels.js';
import { findLeagueWindow, type LeagueWindowBounds } from './gameWindow.js';
import { readWindowMode, type WindowModeReading } from './windowMode.js';
import { decideOverlayVisibility } from './overlayVisibility.js';
import { toDipBounds } from './windows.js';

export interface OverlayNotice {
  code: 'exclusive-fullscreen' | null;
  message: string;
  windowMode: 0 | 1 | 2 | null;
  updatedAt: number;
}

export type GamePhaseName =
  | 'LOBBY'
  | 'MATCHMAKING'
  | 'CHAMP_SELECT'
  | 'IN_GAME'
  | 'END_OF_GAME'
  | 'NONE';

export interface OverlayStatus {
  phase: GamePhaseName | null;
  phaseWantsOverlay: boolean;
  userSuppressed: boolean;
  gameWindowFound: boolean;
  minimized: boolean;
  windowMode: 0 | 1 | 2 | null;
  configFound: boolean;
  visible: boolean;
  notice: OverlayNotice;
}

const EXCLUSIVE_MESSAGE = 'League está en pantalla completa exclusiva. Pon el juego en ventana sin bordes (o en ventana) para ver el overlay.';
const SHOW_PHASES = new Set<GamePhaseName>(['IN_GAME', 'CHAMP_SELECT']);
const HIDE_PHASES = new Set<GamePhaseName>(['NONE', 'END_OF_GAME']);

type Emit = (channel: string, payload: unknown) => void;

export class OverlayController {
  private phase: GamePhaseName | null = null;
  private phaseWants = false;
  private userSuppressed = false;
  private visible = false;
  private poll: NodeJS.Timeout | null = null;
  private lastGame: LeagueWindowBounds | null = null;
  private lastMode: WindowModeReading = { windowMode: null, configFound: false, configPath: null };
  private lastNotice = '';
  private modeTick = 0;

  constructor(
    private readonly overlay: BrowserWindow,
    private readonly emit: Emit,
  ) {}

  start(): void {
    if (this.poll) return;
    this.poll = setInterval(() => this.followGame(), 400);
    this.followGame();
  }

  stop(): void {
    if (!this.poll) return;
    clearInterval(this.poll);
    this.poll = null;
  }

  setPhase(phase: GamePhaseName): void {
    if (this.phase === phase) return;
    this.phase = phase;
    if (SHOW_PHASES.has(phase)) {
      this.phaseWants = true;
      this.userSuppressed = false;
    } else if (HIDE_PHASES.has(phase)) {
      this.phaseWants = false;
    }
    this.followGame();
  }

  requestShow(): void {
    this.phaseWants = true;
    this.userSuppressed = false;
    this.followGame();
  }

  requestHide(): void {
    this.phaseWants = false;
    this.followGame();
  }

  toggleUserVisibility(): boolean {
    this.userSuppressed = this.visible;
    this.followGame();
    return this.visible;
  }

  setInteractive(interactive: boolean): void {
    if (this.overlay.isDestroyed()) return;
    if (interactive) {
      this.overlay.setIgnoreMouseEvents(false);
      return;
    }
    this.overlay.setIgnoreMouseEvents(true, { forward: true });
  }

  status(): OverlayStatus {
    const decision = this.decision();
    return {
      phase: this.phase,
      phaseWantsOverlay: this.phaseWants,
      userSuppressed: this.userSuppressed,
      gameWindowFound: this.lastGame != null,
      minimized: this.lastGame?.minimized ?? false,
      windowMode: this.lastMode.windowMode,
      configFound: this.lastMode.configFound,
      visible: this.visible,
      notice: this.notice(decision.blockedByExclusiveFullscreen),
    };
  }

  private decision() {
    return decideOverlayVisibility({
      phaseWants: this.phaseWants,
      userSuppressed: this.userSuppressed,
      windowFound: this.lastGame != null,
      minimized: this.lastGame?.minimized ?? false,
      windowMode: this.lastMode.windowMode,
      configFound: this.lastMode.configFound,
    });
  }

  private notice(blocked: boolean): OverlayNotice {
    return {
      code: blocked ? 'exclusive-fullscreen' : null,
      message: blocked ? EXCLUSIVE_MESSAGE : '',
      windowMode: this.lastMode.windowMode,
      updatedAt: Date.now(),
    };
  }

  private followGame(): void {
    if (this.overlay.isDestroyed()) return;
    let game: LeagueWindowBounds | null = null;
    try {
      game = findLeagueWindow();
    } catch (error) {
      console.warn('[electron] seguimiento de League falló', error);
      game = null;
    }
    this.lastGame = game;
    this.modeTick += 1;
    if (this.modeTick === 1 || this.modeTick % 5 === 0) {
      try {
        this.lastMode = readWindowMode(game?.executablePath ?? null);
      } catch {
        this.lastMode = { windowMode: null, configFound: false, configPath: null };
      }
    }

    const decision = this.decision();
    const notice = this.notice(decision.blockedByExclusiveFullscreen);
    const noticeKey = `${notice.code}:${notice.windowMode}:${notice.message}`;
    if (noticeKey !== this.lastNotice) {
      this.lastNotice = noticeKey;
      this.emit(IpcChannel.overlayNotice, notice);
    }

    if (!decision.show || !game) {
      this.hide();
      return;
    }

    const dip = toDipBounds({ x: game.x, y: game.y, width: game.width, height: game.height });
    const current = this.overlay.getBounds();
    const moved = current.x !== dip.x || current.y !== dip.y || current.width !== dip.width || current.height !== dip.height;
    if (moved) this.overlay.setBounds(dip);
    if (!this.overlay.isVisible()) {
      this.overlay.showInactive();
      this.visible = true;
    }
  }

  private hide(): void {
    if (this.overlay.isDestroyed()) return;
    if (this.overlay.isVisible()) this.overlay.hide();
    this.visible = false;
  }
}
