import type {
  OverlayCoordinator,
  OverlayFocusRegion,
} from "./overlay-coordinator.types";

export function createOverlayCoordinator(): OverlayCoordinator {
  const notificationOrigins = new Map<string, HTMLElement>();
  const modalRegions: OverlayFocusRegion[] = [];
  let notificationRegion: HTMLElement | null = null;
  let pageRegion: OverlayFocusRegion | null = null;

  const registerRegion = (
    collection: OverlayFocusRegion[],
    region: HTMLElement,
    primary: HTMLElement | null,
  ) => {
    const value = { primary, region };
    collection.push(value);
    return () => {
      const index = collection.indexOf(value);
      if (index >= 0) collection.splice(index, 1);
    };
  };
  const focusRegion = (region: OverlayFocusRegion | null) => {
    const target =
      region?.primary?.isConnected === true
        ? region.primary
        : region?.region.querySelector<HTMLElement>(
            "button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex='-1'])",
          );
    target?.focus();
  };

  return {
    captureNotificationOrigin(id, origin) {
      if (origin !== null && origin.isConnected)
        notificationOrigins.set(id, origin);
    },
    registerModalRegion(region, primary) {
      return registerRegion(modalRegions, region, primary);
    },
    registerNotificationRegion(region) {
      notificationRegion = region;
      return () => {
        if (notificationRegion === region) notificationRegion = null;
      };
    },
    registerPageRegion(region, primary) {
      const value = { primary, region };
      pageRegion = value;
      return () => {
        if (pageRegion === value) pageRegion = null;
      };
    },
    restoreFocus(id) {
      const origin = notificationOrigins.get(id);
      notificationOrigins.delete(id);
      if (
        origin?.isConnected === true &&
        notificationRegion?.contains(origin) === false
      ) {
        origin.focus();
        return;
      }
      focusRegion(modalRegions.at(-1) ?? pageRegion);
    },
  };
}
