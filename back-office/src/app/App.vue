<template>
  <FoundationSurface>
    <StaffShell
      :staff="staff"
      :role="role"
      :busy="session.busy"
      :error="session.error"
      :section="navigation.location.value.section"
      :links="sectionLinks"
      @logout="logout"
      @navigate="navigateSection"
    >
      <template #notifications>
        <Notifications
          v-if="notifications.eligible"
          :identity="session.user?.id ?? ''"
          :section="navigation.location.value.section"
          :view="notifications.view"
          :busy="session.busy"
          @read="notifications.read"
          @enable="notifications.enable"
          @disable="notifications.disable"
          @finish="notifications.finish"
          @open-change="notificationOpen = $event"
        />
      </template>
      <template #notification-order>
        <div v-if="showNotificationOrder" class="app-notification-order">
          <UiButton
            variant="quiet"
            :disabled="notificationOrderBlocked"
            @activate="openNotificationOrder"
            >Открыть выбранный заказ</UiButton
          >
          <span>{{ notificationOrderCaption }}</span>
          <span
            v-if="shellReachable"
            :key="deferredClick?.sequence"
            class="app-announcement"
            role="status"
            aria-atomic="true"
            >{{ replacementAnnouncement }}</span
          >
        </div>
      </template>
      <div v-if="offSectionOrder" class="app-operation">
        <p role="status" aria-atomic="true">
          Заказ {{ offSectionOrder.number }}. {{ orderOperationMessage }}
        </p>
        <a
          :href="navigation.sectionHref('orders', offSectionOrder.id)"
          @click="returnToOrder"
          >Вернуться к заказу {{ offSectionOrder.number }}</a
        >
      </div>
      <AvailabilityOperation
        v-if="offSectionAvailability"
        class="app-operation"
        :operation="offSectionAvailability"
        :disabled="session.busy || invalidAddress"
        @reconcile="recoverAvailability"
      />
      <CatalogOperation
        v-if="offSectionCatalog"
        class="app-operation"
        :operation="offSectionCatalog"
        :disabled="session.busy || invalidAddress"
        @reconcile="recoverCatalog"
        @leave="returnToCatalog"
        @restart="returnToCatalog"
      />
      <KeepAlive v-if="staff">
        <OrdersPage
          v-if="ordersSection"
          :filters="navigation.location.value.filters"
          :selected-id="navigation.location.value.orderId"
          :navigation-error="navigation.location.value.error"
          @reset-address="navigation.resetAddress"
          @search="navigation.search"
          @select="navigation.select"
          @back="navigation.back"
          @search-dirty="searchDirty = $event"
        />
        <AvailabilityPage
          v-else-if="availabilitySection"
          :navigation-error="navigation.location.value.error"
          @reset-address="navigation.resetAddress"
        />
      </KeepAlive>
      <KeepAlive v-if="catalog.allowed" :key="session.user?.id">
        <CatalogPage
          v-if="catalogSection"
          :navigation-error="navigation.location.value.error"
          @reset-address="navigation.resetAddress"
        />
      </KeepAlive>
      <main v-if="catalogDenied" class="app-operation">
        <template v-if="invalidAddress">
          <p role="alert">{{ navigation.location.value.error }}</p>
          <UiButton variant="secondary" @activate="navigation.resetAddress"
            >Исправить адрес</UiButton
          >
        </template>
        <template v-else>
          <p>Каталог доступен только администратору</p>
          <a
            :href="navigation.sectionHref('orders')"
            @click="navigateSection('orders', $event)"
            >К заказам</a
          >
        </template>
      </main>
      <SessionPage v-if="!staff" />
    </StaffShell>
  </FoundationSurface>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import FoundationSurface from "./FoundationSurface.vue";
import StaffShell from "./StaffShell.vue";
import { useOrderNavigation } from "./navigation";
import OrdersPage from "../pages/OrdersPage.vue";
import SessionPage from "../pages/SessionPage.vue";
import AvailabilityPage from "../pages/AvailabilityPage.vue";
import CatalogPage from "../pages/CatalogPage.vue";
import CatalogOperation from "../widgets/catalog/CatalogOperation.vue";
import UiButton from "../shared/ui/UiButton/UiButton.vue";
import AvailabilityOperation from "../features/availability-change/AvailabilityOperation.vue";
import { useSessionStore } from "../entities/session/session.store";
import { useOrderStore } from "../entities/order/order.store";
import { useOtpStore } from "../features/auth/otp.store";
import { useAvailabilityStore } from "../entities/availability/availability.store";
import { useCatalogStore } from "../entities/catalog/catalog.store";
import { orderActionCopy } from "../features/order-transition/OrderTransition.constants";
import { staffSections } from "./navigation.constants";
import type { StaffSection } from "./navigation.types";
import type { SectionScroll } from "./App.types";
import Notifications from "../features/notifications/Notifications.vue";
import { useNotificationStore } from "../entities/notification/notification.store";
import { listenForNotificationClick } from "./notification-click";
import type { NotificationClickIntent } from "./staff-push.worker.types";
import workerURL from "../../staff-push-worker?worker&url";

const session = useSessionStore();
const orders = useOrderStore();
const availability = useAvailabilityStore();
const catalog = useCatalogStore();
const otp = useOtpStore();
const navigation = useOrderNavigation();
const notifications = useNotificationStore();
const notificationOpen = ref(false);
const searchDirty = ref(false);
const deferredClick = shallowRef<NotificationClickIntent | null>(null);
const replacedClick = ref(false);
const replacementAnnouncement = ref("");
const shellReachable = ref(true);
const handoffPending = ref(false);
let interaction = 0;
let lifetime = 0;
let disposed = false;
const pushOwner = {
  scriptURL: new URL(workerURL, window.location.href).href,
  scope: new URL(import.meta.env.BASE_URL, window.location.origin).href,
};

notifications.configure(pushOwner);
const staff = computed(() => session.status === "staff");
const role = computed(() => session.user?.role ?? null);
const ordersSection = computed(
  () => navigation.location.value.section === "orders",
);
const invalidAddress = computed(() => navigation.location.value.error !== "");
const showNotificationOrder = computed(
  () => staff.value && deferredClick.value !== null,
);
const notificationOrderBlocked = computed(
  () =>
    session.busy ||
    invalidAddress.value ||
    notificationOpen.value ||
    !shellReachable.value ||
    handoffPending.value,
);
const notificationOrderCaption = computed(() =>
  replacedClick.value
    ? "Заказ из последнего нажатого уведомления"
    : "Заказ из уведомления",
);
const availabilitySection = computed(
  () => navigation.location.value.section === "availability",
);
const catalogSection = computed(
  () => navigation.location.value.section === "catalog",
);
const catalogDenied = computed(
  () => staff.value && catalogSection.value && !catalog.allowed,
);
const sectionLinks = computed(() =>
  staffSections
    .filter((section) => section.id !== "catalog" || catalog.allowed)
    .map((section) => ({
      ...section,
      href: navigation.sectionHref(section.id),
    })),
);
const offSectionOrder = computed(() =>
  staff.value && !ordersSection.value && orders.commandLocked
    ? orders.operation
    : null,
);
const offSectionAvailability = computed(() =>
  staff.value && !availabilitySection.value && availability.locked
    ? availability.operation
    : null,
);
const offSectionCatalog = computed(() =>
  catalog.allowed && !catalogSection.value && catalog.locked
    ? catalog.operation
    : null,
);
const orderOperationMessage = computed(() => {
  const operation = offSectionOrder.value;

  if (operation === null) return "";

  return operation.status === "sending"
    ? orderActionCopy[operation.action].pending
    : operation.message;
});
let sectionScroll: SectionScroll = { orders: 0, availability: 0, catalog: 0 };

function modalOpen() {
  return (
    notificationOpen.value ||
    [...document.querySelectorAll('dialog[open], [aria-modal="true"]')].some(
      (element) => element.getClientRects().length > 0,
    )
  );
}

function userInteraction() {
  interaction += 1;
}

async function refreshReachability() {
  await nextTick();
  if (!disposed) shellReachable.value = !modalOpen();
}

function retainClick(intent: NotificationClickIntent) {
  const previous = deferredClick.value;

  if (previous?.orderId === intent.orderId) {
    deferredClick.value = intent;

    return;
  }

  replacedClick.value = previous !== null;
  replacementAnnouncement.value =
    previous === null ? "" : "Выбран заказ из последнего нажатого уведомления";
  deferredClick.value = intent;
  shellReachable.value = !modalOpen();
}

function freeQueue() {
  return (
    staff.value &&
    !session.busy &&
    !invalidAddress.value &&
    !modalOpen() &&
    ordersSection.value &&
    navigation.location.value.orderId === null &&
    !searchDirty.value &&
    !orders.commandLocked &&
    !availability.locked &&
    !catalog.locked &&
    !catalog.dirty
  );
}

const clicks = listenForNotificationClick({
  owner: pushOwner,
  interaction: () => interaction,
  lifetime: () => lifetime,
  receive(intent, intervened) {
    if (disposed) return;
    if (!staff.value) {
      if (
        ["anonymous", "restoring"].includes(session.status) &&
        !session.busy &&
        !invalidAddress.value &&
        !modalOpen() &&
        !intervened
      )
        navigation.activateSection("orders", intent.orderId);

      return;
    }

    if (deferredClick.value?.orderId === intent.orderId) {
      deferredClick.value = intent;

      return;
    }

    if (deferredClick.value !== null) {
      retainClick(intent);

      return;
    }

    if (
      ordersSection.value &&
      navigation.location.value.orderId === intent.orderId
    )
      return;

    if (!intervened && freeQueue())
      navigation.activateSection("orders", intent.orderId);
    else retainClick(intent);
  },
});

async function openNotificationOrder() {
  const intent = deferredClick.value;
  const version = lifetime;
  const movement = interaction;

  if (
    intent === null ||
    handoffPending.value ||
    !staff.value ||
    session.busy ||
    invalidAddress.value ||
    modalOpen()
  )
    return;

  handoffPending.value = true;
  try {
    const confirmed = await clicks.confirmCurrent(intent);

    if (
      !confirmed ||
      disposed ||
      lifetime !== version ||
      interaction !== movement ||
      deferredClick.value !== intent ||
      !staff.value ||
      session.busy ||
      invalidAddress.value ||
      modalOpen()
    )
      return;

    navigation.activateSection("orders", intent.orderId);
    if (deferredClick.value === intent) {
      deferredClick.value = null;
      replacedClick.value = false;
      replacementAnnouncement.value = "";
    }
  } finally {
    handoffPending.value = false;
  }
}

function logout() {
  // Invalidate navigation immediately; notification command ownership is separate.
  lifetime += 1;
  clicks.invalidate();
  deferredClick.value = null;
  void session.logout(notifications.logoutProof);
}

function ordinaryClick(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return false;

  event.preventDefault();

  return true;
}

function navigateSection(section: StaffSection, event: MouseEvent) {
  if (ordinaryClick(event)) navigation.activateSection(section);
}

function returnToOrder(event: MouseEvent) {
  if (ordinaryClick(event) && offSectionOrder.value !== null)
    navigation.activateSection("orders", offSectionOrder.value.id);
}

async function recoverAvailability() {
  if (invalidAddress.value) return;

  navigation.activateSection("availability");
  await nextTick();
  await availability.reconcile();
}

async function recoverCatalog() {
  if (invalidAddress.value || !catalog.allowed) return;

  navigation.activateSection("catalog");
  await nextTick();
  await catalog.reconcile();
}

function returnToCatalog() {
  if (!invalidAddress.value && catalog.allowed)
    navigation.activateSection("catalog");
}

watch(
  () => navigation.location.value.section,
  async (section, previous) => {
    const version = lifetime;
    const movement = interaction;
    const selected = navigation.location.value.orderId;

    sectionScroll[previous] = window.scrollY;
    await nextTick();

    if (
      !disposed &&
      version === lifetime &&
      movement === interaction &&
      !modalOpen() &&
      staff.value &&
      navigation.location.value.section === section &&
      navigation.location.value.orderId === selected &&
      selected === null
    ) {
      document
        .getElementById("staff-section-heading")
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: sectionScroll[section] });
    }
  },
);
watch(
  () => [staff.value, navigation.location.value.section],
  () => {
    document.title = staff.value
      ? `${staffSections.find((section) => section.id === navigation.location.value.section)?.label} · Expressa`
      : "Вход · Expressa";
  },
  { immediate: true },
);

watch(
  () => session.status,
  (status) => {
    if (status !== "staff") {
      orders.clear();
      availability.clear();
      sectionScroll = { orders: 0, availability: 0, catalog: 0 };
    }

    if (status === "staff" || status === "denied") {
      otp.clear();
    }
  },
  { flush: "sync" },
);

watch(
  [() => session.status, () => session.user?.id, () => session.user?.role],
  () => {
    lifetime += 1;
    clicks.invalidate();
    deferredClick.value = null;
    replacementAnnouncement.value = "";
    replacedClick.value = false;
    searchDirty.value = false;
    catalog.clear();
    sectionScroll.catalog = 0;
  },
  { flush: "sync" },
);
watch(() => catalog.mutationEpoch, availability.invalidateCatalog, {
  flush: "sync",
});

onMounted(session.restore);
watch(notificationOpen, refreshReachability);
document.addEventListener("pointerdown", userInteraction, true);
document.addEventListener("keydown", userInteraction, true);
document.addEventListener("focusin", refreshReachability);
window.addEventListener("popstate", userInteraction);
onUnmounted(() => {
  disposed = true;
  lifetime += 1;
  clicks.dispose();
  notifications.dispose();
  document.removeEventListener("pointerdown", userInteraction, true);
  document.removeEventListener("keydown", userInteraction, true);
  document.removeEventListener("focusin", refreshReachability);
  window.removeEventListener("popstate", userInteraction);
});
</script>

<style scoped>
.app-operation {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  margin-block-end: var(--space-xl);
  overflow-wrap: anywhere;
}
.app-operation a {
  min-block-size: var(--control-height);
  display: inline-flex;
  align-items: center;
  color: var(--color-primary);
}
.app-notification-order {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-block-end: var(--space-lg);
  overflow-wrap: anywhere;
}
.app-notification-order > span {
  font-size: var(--font-data);
  color: var(--color-foreground-muted);
}
.app-announcement {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
