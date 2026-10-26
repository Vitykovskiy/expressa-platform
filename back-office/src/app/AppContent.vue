<template>
  <AppLayout
    :administrator="administrator"
    :section="section"
    :links="links"
    :notification-order="notificationOrder"
    :notification-message="notificationMessage"
    :navigation-busy="navigationBusy"
    @navigate="navigateLink"
    @logout="emit('logout')"
    @show-notifications="notifications.show"
    @open-notification="emit('openNotification')"
  >
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
          v-if="showCatalog"
          :context="context"
          @session-expired="emit('sessionExpired')"
        />
      </KeepAlive>
      <UsersRoute
        v-if="showUsers"
        :session="session"
        @session-expired="emit('sessionExpired')"
      />
      <SettingsRoute v-else-if="showSettings" />
      <section v-if="routeRefusal" class="route-refusal">
        <h1>{{ title }}</h1>
        <p>{{ routeRefusal }}</p>
        <a :href="links.orders" @click="navigateLink($event, links.orders)"
          >К заказам</a
        >
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import NotificationsDialog from "../modules/notifications/components/NotificationsDialog.vue";
import { useNotificationsStore } from "../modules/notifications/notifications.store";
import { computed, nextTick, onScopeDispose, useTemplateRef, watch } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import { APP_NAVIGATION } from "../layouts/AppNavigation.constants";
import OrdersRoute from "../modules/orders/OrdersRoute.vue";
import AvailabilityPage from "../modules/availability/AvailabilityPage.vue";
import CatalogPage from "../modules/catalog/CatalogPage.vue";
import UsersRoute from "../modules/users/UsersRoute.vue";
import SettingsRoute from "../modules/settings/SettingsRoute.vue";
import { useCatalogStore } from "../modules/catalog/catalog.store";
import { useSettingsStore } from "../modules/settings/settings.store";
import type { AppSection } from "../layouts/AppNavigation.types";
import type { AppContentProps, AppContentEmits } from "./AppContent.types";

const props = defineProps<AppContentProps>();
const emit = defineEmits<AppContentEmits>();

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
const selectedNavigation = computed(() =>
  APP_NAVIGATION.find((item) => item.section === section.value),
);

const title = computed(
  () => selectedNavigation.value?.label ?? "Неверный адрес",
);

const showCatalog = computed(
  () => section.value === "catalog" && administrator.value,
);
const showUsers = computed(
  () => section.value === "users" && administrator.value,
);
const showSettings = computed(
  () => section.value === "settings" && administrator.value,
);

const routeRefusal = computed(() => {
  if (section.value === null) {
    return "Проверьте адрес раздела.";
  }

  if (selectedNavigation.value?.administratorOnly && !administrator.value) {
    return "Раздел доступен только администратору.";
  }

  return null;
});

const links = computed(() => {
  // Реактивный URL сохраняет текущие параметры и hash после переходов внутри страницы.
  const url = new globalThis.URL(props.locationHref);
  const result = {
    orders: "",
    availability: "",
    catalog: "",
    users: "",
    settings: "",
  };

  for (const item of APP_NAVIGATION) {
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

  activateSectionOwners();
  globalThis.document.title = `${title.value} · Expressa`;
  await focusSectionAfterRender(selected);
}

function activateSectionOwners() {
  // Deactivate прекращает обычные чтения; исход отправленной команды остаётся у store.
  settings.deactivate();
  catalog.deactivate();

  if (showCatalog.value) {
    void catalog.activate(context.value);
  }

  if (!administrator.value) {
    notifications.activate(context.value);
  }

  if (showSettings.value) {
    void settings.activate(context.value);
  }
}

async function focusSectionAfterRender(selected: AppSection | null) {
  await nextTick();

  if (section.value !== selected) {
    return;
  }

  // Заказы и доступность сами фокусируют заголовок после монтирования.
  if (selected === "orders" || selected === "availability") {
    return;
  }

  content.value?.focus();
}

watch([section, () => props.session], activateSection, { immediate: true });
onScopeDispose(() => settings.deactivate());
</script>

<style scoped>
.staff-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  outline: none;
  background: var(--color-surface);
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
