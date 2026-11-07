/** IPC allowlist shared by the main process. The sandboxed preload repeats these literals. */

export const IpcChannel = {
  windowOpen: 'lol:window-open',
  windowClose: 'lol:window-close',
  windowMinimize: 'lol:window-minimize',
  overlaySetInteractive: 'lol:overlay-set-interactive',
  overlayToggle: 'lol:overlay-toggle',
  overlayGetStatus: 'lol:overlay-get-status',
  gameTime: 'lol:game-time',
  gameEvent: 'lol:game-event',
  gamePhase: 'lol:game-phase',
  hotkey: 'lol:hotkey',
  overlayNotice: 'lol:overlay-notice',
} as const;

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel];

export const invokeChannels = new Set<string>([
  IpcChannel.windowOpen,
  IpcChannel.windowClose,
  IpcChannel.windowMinimize,
  IpcChannel.overlaySetInteractive,
  IpcChannel.overlayToggle,
  IpcChannel.overlayGetStatus,
]);

export const eventChannels = new Set<string>([
  IpcChannel.gameTime,
  IpcChannel.gameEvent,
  IpcChannel.gamePhase,
  IpcChannel.hotkey,
  IpcChannel.overlayNotice,
]);

export const windowNames = ['background', 'desktop', 'in_game_overlay'] as const;
export type AppWindowName = (typeof windowNames)[number];

export function canonicalWindowName(value: unknown): AppWindowName | null {
  if (value === 'overlay') return 'in_game_overlay';
  if (value === 'background' || value === 'desktop' || value === 'in_game_overlay') return value;
  return null;
}
