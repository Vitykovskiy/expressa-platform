import { onScopeDispose, watch } from "vue";
import { useNotificationsStore } from "../features/notifications/notifications.store";
import { useSessionStore } from "../entities/session/session.store";
import { useAvailabilityStore } from "../entities/availability/availability.store";
import { useOrdersStore } from "../entities/orders/orders.store";
import { useCatalogStore } from "../entities/catalog/catalog.store";
import { useSettingsStore } from "../entities/settings/settings.store";
import { useUsersStore } from "../features/users/users.store";

export function useStaffDomains(onExpired: () => void) {
  const session = useSessionStore();
  const availability = useAvailabilityStore();
  const orders = useOrdersStore();
  const catalog = useCatalogStore();
  const settings = useSettingsStore();
  const users = useUsersStore();
  const notifications = useNotificationsStore();

  function clear() {
    availability.clear();
    orders.reset();
    catalog.clear();
    settings.reset();
    users.clear();
    notifications.reset();
  }

  watch(
    () => session.state,
    (state, previous) => {
      if (
        state.kind !== "staff" ||
        previous.kind !== "staff" ||
        state.session.identity.id !== previous.session.identity.id ||
        state.session.identity.role !== previous.session.identity.role ||
        state.session.accessToken !== previous.session.accessToken
      ) {
        clear();
      }
    },
    { flush: "sync" },
  );

  watch(
    () =>
      availability.sessionExpired ||
      orders.sessionExpired ||
      catalog.sessionExpired ||
      settings.sessionExpired ||
      users.sessionExpired ||
      notifications.sessionExpired,
    (expired) => {
      if (expired) {
        onExpired();
      }
    },
    { flush: "sync" },
  );
  watch(
    () => catalog.revision,
    () => availability.invalidate(),
  );
  onScopeDispose(clear);

  return { availability, orders, catalog, settings, users, notifications };
}
