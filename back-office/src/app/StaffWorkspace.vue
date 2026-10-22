<template>
  <div class="staff-workspace">
    <StaffNavigation
      :administrator="administrator"
      :section="section"
      :links="links"
      @navigate="navigateLink"
      @logout="emit('logout')"
    >
      <template #actions
        ><button
          v-if="!administrator"
          class="quiet-action"
          type="button"
          @click="notifications.show"
        >
          Уведомления
        </button></template
      >
      <template #selection
        ><div v-if="notificationOrder" role="status" aria-live="polite">
          <p class="selection-message">{{ notificationMessage }}</p>
          <button
            class="quiet-action"
            type="button"
            :disabled="navigationBusy"
            @click="emit('openNotification')"
          >
            Открыть выбранный заказ
          </button>
        </div></template
      >
    </StaffNavigation>
    <div
      class="mobile-account"
      :class="{ 'orders-account': section === 'orders' }"
    >
      <button
        v-if="!administrator"
        class="quiet-action"
        type="button"
        @click="notifications.show"
      >
        Уведомления</button
      ><button class="quiet-action" type="button" @click="emit('logout')">
        Выйти
      </button>
    </div>
    <div
      v-if="notificationOrder"
      class="mobile-selection"
      role="status"
      aria-live="polite"
    >
      <p class="selection-message">{{ notificationMessage }}</p>
      <button
        class="quiet-action"
        type="button"
        :disabled="navigationBusy"
        @click="emit('openNotification')"
      >
        Открыть выбранный заказ
      </button>
    </div>
    <NotificationsDialog v-if="!administrator" />
    <div ref="content" class="staff-content" tabindex="-1">
      <OrdersRoute
        v-if="section === 'orders'"
        :context="context"
        :search="search"
        @session-expired="emit('sessionExpired')"
        @navigate="emit('navigate', $event)"
      />
      <AvailabilityPage
        v-else-if="section === 'availability'"
        :context="context"
        @session-expired="emit('sessionExpired')"
      />
      <KeepAlive :max="1"
        ><CatalogPage
          v-if="section === 'catalog' && administrator"
          :context="context"
          @session-expired="emit('sessionExpired')"
        />
      </KeepAlive>
      <UsersRoute
        v-if="section === 'users' && administrator"
        :session="session"
        @session-expired="emit('sessionExpired')"
      />
      <SettingsRoute v-else-if="section === 'settings' && administrator" />
      <section
        v-if="
          section === null ||
          (!administrator && section !== 'orders' && section !== 'availability')
        "
        class="route-refusal"
      >
        <h1>{{ section === null ? "Неверный адрес" : title }}</h1>
        <p>
          {{
            section === null
              ? "Проверьте адрес раздела."
              : "Раздел доступен только администратору."
          }}
        </p>
        <a :href="links.orders" @click="navigateLink($event, links.orders)"
          >К заказам</a
        >
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import NotificationsDialog from "../features/notifications/NotificationsDialog.vue";
import { useNotificationsStore } from "../features/notifications/notifications.store";
import { computed, nextTick, onScopeDispose, useTemplateRef, watch } from "vue";
import StaffNavigation from "../widgets/staff/StaffNavigation.vue";
import { STAFF_NAVIGATION } from "../widgets/staff/StaffNavigation.constants";
import OrdersRoute from "../pages/orders/OrdersRoute.vue";
import AvailabilityPage from "../pages/availability/AvailabilityPage.vue";
import CatalogPage from "../pages/catalog/CatalogPage.vue";
import UsersRoute from "../pages/users/UsersRoute.vue";
import SettingsRoute from "../pages/settings/SettingsRoute.vue";
import { useCatalogStore } from "../entities/catalog/catalog.store";
import { useSettingsStore } from "../entities/settings/settings.store";
import type { StaffWorkspaceProps } from "./StaffWorkspace.types";

const props = defineProps<StaffWorkspaceProps>();
const emit = defineEmits<{
  logout: [];
  sessionExpired: [];
  navigate: [href: string];
  openNotification: [];
}>();
const catalog = useCatalogStore();
const settings = useSettingsStore();
const notifications = useNotificationsStore();
const content = useTemplateRef<globalThis.HTMLDivElement>("content");
const administrator = computed(
  () => props.session.identity.role === "administrator",
);
const section = computed(() =>
  props.intent.kind === "valid" ? props.intent.section : null,
);
const context = computed(() => ({
  identityId: props.session.identity.id,
  accessToken: props.session.accessToken,
}));
const title = computed(
  () =>
    STAFF_NAVIGATION.find((item) => item.section === section.value)?.label ??
    "Неверный адрес",
);
const links = computed(() => {
  const url = new globalThis.URL(globalThis.window.location.href);
  const result = {
    orders: "",
    availability: "",
    catalog: "",
    users: "",
    settings: "",
  };

  for (const item of STAFF_NAVIGATION) {
    url.searchParams.delete("section");
    if (item.section !== "orders") {
      url.searchParams.set("section", item.section);
    }

    result[item.section] = `${url.pathname}${url.search}${url.hash}`;
  }

  return result;
});

function navigateLink(event: globalThis.MouseEvent, href: string) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();
  emit("navigate", href);
}

async function activateSection() {
  const selected = section.value;

  settings.deactivate();
  catalog.deactivate();
  if (selected === "catalog" && administrator.value) {
    void catalog.activate(context.value);
  }

  if (!administrator.value) {
    notifications.activate(context.value);
  }

  if (selected === "settings" && administrator.value) {
    void settings.activate(context.value);
  }

  globalThis.document.title = `${title.value} · Expressa`;
  await nextTick();
  if (section.value !== selected) {
    return;
  }

  if (
    selected === "users" ||
    selected === "settings" ||
    selected === "catalog" ||
    selected === null ||
    (!administrator.value &&
      selected !== "orders" &&
      selected !== "availability")
  ) {
    content.value?.focus();
  }
}

watch([section, () => props.session], activateSection, { immediate: true });
onScopeDispose(() => settings.deactivate());
</script>

<style scoped>
.staff-workspace {
  display: flex;
  width: 100%;
  height: 100dvh;
  min-width: 0;
}
.staff-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  outline: none;
  background: var(--color-surface);
}
.quiet-action {
  border: 0;
  padding: 12px;
  background: transparent;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  cursor: pointer;
}
.mobile-selection {
  display: none;
}
.selection-message {
  margin: 0;
  padding: 8px 12px 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--color-foreground-muted);
}
.mobile-account {
  display: none;
}
.route-refusal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  font-size: 14px;
  line-height: 20px;
}
.route-refusal h1 {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}
.route-refusal p {
  margin: 0;
}
.route-refusal a {
  color: var(--color-primary);
}
@media (max-width: 767px) {
  .mobile-selection {
    position: fixed;
    display: block;
    z-index: 4;
    bottom: 60px;
    right: 0;
    background: var(--color-surface);
  }
  .mobile-account {
    position: fixed;
    z-index: 3;
    right: 8px;
    top: 4px;
    display: flex;
  }
  .quiet-action {
    padding: 8px;
    font-size: 11px;
  }
  .orders-account {
    right: 48px;
  }
  .route-refusal {
    padding: 16px;
  }
  .route-refusal h1 {
    font-size: 18px;
    line-height: 28px;
  }
  .staff-content {
    height: calc(100dvh - 60px);
  }
}
</style>
