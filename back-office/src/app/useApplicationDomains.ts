import { onScopeDispose, watch } from "vue";
import { useNotificationsStore } from "../modules/notifications/notifications.store";
import { useSessionStore } from "../modules/session/session.store";
import { useAvailabilityStore } from "../modules/availability/availability.store";
import { useOrdersStore } from "../modules/orders/orders.store";
import { useCatalogStore } from "../modules/catalog/catalog.store";
import { useSettingsStore } from "../modules/settings/settings.store";
import { useUsersStore } from "../modules/users/users.store";

// Очищает данные разделов при смене сеанса и помечает доступность устаревшей после изменения каталога.
export function useApplicationDomains(onExpired: () => void) {
  const session = useSessionStore();
  const availability = useAvailabilityStore();
  const orders = useOrdersStore();
  const catalog = useCatalogStore();
  const settings = useSettingsStore();
  const users = useUsersStore();
  const notifications = useNotificationsStore();

  function clearProtectedDomains() {
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
        state.kind === "staff" &&
        previous.kind === "staff" &&
        state.session.identity.id === previous.session.identity.id &&
        state.session.identity.employee.role ===
          previous.session.identity.employee.role &&
        state.session.accessToken === previous.session.accessToken
      ) {
        return;
      }

      // Роль и token отзывают прежний контекст, даже если ID сотрудника не изменился.
      clearProtectedDomains();
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
  onScopeDispose(clearProtectedDomains);

  return { availability, orders, catalog, settings, users, notifications };
}
