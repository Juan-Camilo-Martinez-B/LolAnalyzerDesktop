export interface VisibilityInput {
  phaseWants: boolean;
  userSuppressed: boolean;
  windowFound: boolean;
  minimized: boolean;
  windowMode: number | null;
  configFound: boolean;
}

export interface VisibilityDecision {
  show: boolean;
  blockedByExclusiveFullscreen: boolean;
}

/** WindowMode 0 is exclusive fullscreen. A missing cfg does not block the overlay. */
export function decideOverlayVisibility(input: VisibilityInput): VisibilityDecision {
  const blockedByExclusiveFullscreen = input.configFound && input.windowMode === 0;
  const show = input.phaseWants
    && !input.userSuppressed
    && input.windowFound
    && !input.minimized
    && !blockedByExclusiveFullscreen
    && input.windowMode !== 0;
  return { show, blockedByExclusiveFullscreen };
}
