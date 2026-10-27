<template>
  <AppLayout
    :administrator="administrator"
    :section="section"
    :navigation="navigation"
    :notification-order="notificationOrder"
    :notification-message="notificationMessage"
    :navigation-busy="navigationBusy"
    @logout="emit('logout')"
    @show-notifications="notifications.show"
    @open-notification="emit('openNotification')"
  >
    <NotificationsDialog v-if="!administrator" />
    <div ref="content" class="staff-content" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <KeepAlive include="CatalogPage" :max="1">
          <component
            :is="Component"
            v-if="!routeRefusal"
            v-bind="pageProps"
            v-on="pageEvents"
          />
        </KeepAlive>
      </RouterView>
      <section v-if="routeRefusal" class="route-refusal">
        <h1>{{ title }}</h1>
        <p>{{ routeRefusal }}</p>
        <RouterLink v-slot="{ href, navigate }" :to="ordersLocation" custom>
          <a :href="href" @click="navigate">К заказам</a>
        </RouterLink>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import NotificationsDialog from "../modules/notifications/components/NotificationsDialog.vue";
import { useNotificationsStore } from "../modules/notifications/notifications.store";
import { computed, nextTick, onScopeDispose, useTemplateRef, watch } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import { APP_NAVIGATION } from "../layouts/AppNavigation.constants";
import { useCatalogStore } from "../modules/catalog/catalog.store";
import { useSettingsStore } from "../modules/settings/settings.store";
import type { AppSection } from "../layouts/AppNavigation.types";
import type { AppContentProps, AppContentEmits } from "./AppContent.types";

const props = defineProps<AppContentProps>();
const emit = defineEmits<AppContentEmits>();

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const settings = useSettingsStore();
const notifications = useNotificationsStore();
const content = useTemplateRef<globalThis.HTMLDivElement>("content");

const administrator = computed(
  () => props.session.identity.employee.role === "administrator",
);
const section = computed(() => route.name as AppSection);
const context = computed(() => ({
  identityId: props.session.identity.id,
  accessToken: props.session.accessToken,
}));
const title = computed(() => route.meta.title ?? "Expressa");
const showCatalog = computed(
  () => section.value === "catalog" && administrator.value,
);
const showSettings = computed(
  () => section.value === "settings" && administrator.value,
);
const routeRefusal = computed(() =>
  route.meta.administratorOnly && !administrator.value
    ? "Раздел доступен только администратору."
    : null,
);
const navigationQuery = computed(() => {
  const query = { ...route.query };

  delete query.section;

  return query;
});
const ordersLocation = computed(() => ({
  name: "orders",
  query: navigationQuery.value,
  hash: route.hash,
}));
const navigation = computed(() =>
  APP_NAVIGATION.flatMap((item) => {
    const meta = router.resolve({ name: item.section }).meta;

    if (meta.administratorOnly && !administrator.value) {
      return [];
    }

    return [
      {
        ...item,
        label: meta.title ?? "Expressa",
        to: {
          name: item.section,
          query: navigationQuery.value,
          hash: route.hash,
        },
      },
    ];
  }),
);

// Only adapt page data here; the matched router record selects the component.
const pageProps = computed(() => {
  const byName = {
    orders: { context: context.value, query: route.query },
    availability: { context: context.value },
    catalog: { context: context.value },
    users: { session: props.session },
    settings: {},
  } satisfies Record<AppSection, object>;

  return byName[route.name as AppSection];
});
const pageEvents = computed(() =>
  section.value === "settings"
    ? {}
    : {
        sessionExpired: () => emit("sessionExpired"),
      },
);

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

async function focusSectionAfterRender(selected: typeof route.name) {
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
