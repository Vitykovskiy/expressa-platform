import { notificationInvitationStoragePrefix } from "./notification-invitation.constants";
import type { NotificationInvitationStorage } from "./notification-invitation.types";

export function hasNotificationInvitationChoice(
  accountId: string,
  storage: NotificationInvitationStorage = window.localStorage,
): boolean {
  try {
    return storage.getItem(key(accountId)) === "seen";
  } catch {
    return true;
  }
}

export function rememberNotificationInvitationChoice(
  accountId: string,
  storage: NotificationInvitationStorage = window.localStorage,
): boolean {
  try {
    storage.setItem(key(accountId), "seen");
    return true;
  } catch {
    return false;
  }
}

function key(accountId: string): string {
  return `${notificationInvitationStoragePrefix}:${accountId}`;
}
