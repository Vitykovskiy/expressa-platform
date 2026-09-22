import type { InjectionKey } from "vue";

export interface OverlayFocusRegion {
  primary: HTMLElement | null;
  region: HTMLElement;
}

export interface OverlayCoordinator {
  captureNotificationOrigin(id: string, origin: HTMLElement | null): void;
  registerModalRegion(
    region: HTMLElement,
    primary: HTMLElement | null,
  ): () => void;
  registerNotificationRegion(region: HTMLElement): () => void;
  registerPageRegion(
    region: HTMLElement,
    primary: HTMLElement | null,
  ): () => void;
  restoreFocus(id: string): void;
}

export const overlayCoordinatorKey: InjectionKey<OverlayCoordinator> =
  Symbol("overlayCoordinator");
