import { readonly, shallowRef } from "vue";

const occupiedBand = shallowRef(0);
let activeOwner: symbol | null = null;

export const notificationOccupiedBand = readonly(occupiedBand);

export function publishNotificationBand(owner: symbol, band: number): void {
  if (band <= 0) {
    releaseNotificationBand(owner);
    return;
  }
  activeOwner = owner;
  occupiedBand.value = band;
}

export function releaseNotificationBand(owner: symbol): void {
  if (activeOwner !== owner) return;
  activeOwner = null;
  occupiedBand.value = 0;
}
