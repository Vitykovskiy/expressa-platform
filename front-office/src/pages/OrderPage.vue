<template>
  <section class="order-page" aria-labelledby="order-title">
    <div v-if="loading" class="order-page__state" role="status">
      Загружаем заказ
    </div>
    <template v-else-if="order">
      <header class="order-page__header">
        <p class="order-page__stage">{{ stageLabel }}</p>
        <h1 id="order-title">Заказ №{{ order.number }}</h1>
      </header>
      <ul class="order-page__items" aria-label="Состав заказа">
        <li v-for="item in order.items" :key="itemKey(item)">
          <div class="order-page__item-main">
            <strong>{{ item.productName }}</strong>
            <span
              >{{ item.quantity }} ×
              {{ formatMinorAmount(item.unitTotalMinor) }}</span
            >
            <p v-if="item.size">Размер {{ item.size }}</p>
            <p
              v-for="modifier in item.modifiers"
              :key="modifier.modifierOptionId"
            >
              + {{ modifier.modifierName }}
            </p>
          </div>
          <strong class="order-page__item-total">{{
            formatMinorAmount(item.lineTotalMinor)
          }}</strong>
        </li>
      </ul>
      <p class="order-page__total">
        <span>Итого</span
        ><strong>{{ formatMinorAmount(order.totalMinor) }}</strong>
      </p>
      <p class="order-page__payment">Оплата на кассе при получении</p>
      <section
        class="order-page__notifications"
        aria-labelledby="notifications-title"
      >
        <h2 id="notifications-title">Уведомления о заказе</h2>
        <p v-if="!pushSupported">{{ orderPageMessages.pushUnsupported }}</p>
        <template v-else>
          <p v-if="pushMessage" role="status">{{ pushMessage }}</p>
          <ui-btn
            v-if="pushSubscription === null"
            :disabled="pushOperationPending"
            type="button"
            @click="enablePushNotifications"
          >
            Включить уведомления
          </ui-btn>
          <ui-btn
            v-else
            :disabled="pushOperationPending"
            type="button"
            @click="disablePushNotifications"
          >
            Отключить уведомления
          </ui-btn>
        </template>
      </section>
      <ui-btn
        v-if="order.stage === 'ISSUED'"
        class="order-page__repeat"
        color="surface"
        type="button"
        @click="prepareRepeat"
      >
        Повторить заказ
      </ui-btn>
      <div v-if="impossibleItems.length" class="order-page__alert" role="alert">
        <p>{{ orderPageMessages.repeatImpossible }}</p>
        <ul>
          <li v-for="item in impossibleItems" :key="item">{{ item }}</li>
        </ul>
      </div>
    </template>
    <div v-else class="order-page__state" role="status">
      <h1 id="order-title">Заказ</h1>
      <p>{{ errorMessage ?? orderPageMessages.unavailable }}</p>
    </div>
    <ui-dialog
      v-if="repeatConfirmationOpen"
      v-model="repeatConfirmationOpen"
      max-width="32rem"
    >
      <section class="order-page__dialog" aria-labelledby="repeat-title">
        <h2 id="repeat-title">Заменить корзину?</h2>
        <p>Текущие позиции в корзине будут заменены повтором заказа.</p>
        <ui-btn type="button" @click="confirmRepeat">Заменить корзину</ui-btn>
        <ui-btn type="button" @click="repeatConfirmationOpen = false"
          >Отмена</ui-btn
        >
      </section>
    </ui-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "@/app/session.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { formatMinorAmount } from "@/entities/customer/model/money";
import { toCartItemDraft } from "@/features/menu/product-configuration";
import {
  createPublicMenuApi,
  type PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import { apiClientKey } from "@/shared/api/client";
import { createOrdersApi, type CustomerOrder } from "@/shared/api/orders.api";
import { createPushApi } from "@/shared/api/push.api";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiDialog from "@/shared/ui/customer/dialog/UiDialog.vue";
import {
  orderPageMessages,
  orderPageStageLabels,
  orderPollingIntervalMs,
} from "./OrderPage.constants";
import type {
  OrderPageItem,
  OrderPageOrder,
  OrderPagePushSubscription,
} from "./OrderPage.types";

const route = useRoute();
const router = useRouter();
const apiClient = inject(apiClientKey);
const sessionStore = useSessionStore();
const cartStore = useCartStore();
const order = ref<OrderPageOrder | null>(null);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const impossibleItems = ref<string[]>([]);
const pushMessage = ref<string | null>(null);
const pushOperationPending = ref(false);
const pushSubscription = ref<OrderPagePushSubscription | null>(null);
const repeatConfirmationOpen = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let repeatItems: Parameters<typeof cartStore.replace>[0] = [];
const stageLabel = computed(() =>
  order.value === null ? "" : orderPageStageLabels[order.value.stage],
);
const pushSupported = computed(
  () => "serviceWorker" in navigator && "PushManager" in window,
);

onMounted(() => {
  document.addEventListener("visibilitychange", syncPolling);
  void loadPushSubscription();
  void loadOrder();
});
onUnmounted(() => {
  document.removeEventListener("visibilitychange", syncPolling);
  stopPolling();
});
watch(
  () => route.params.id,
  () => void loadOrder(),
);

async function loadOrder(): Promise<void> {
  stopPolling();
  loading.value = true;
  errorMessage.value = null;
  const orderId = route.params.id;
  if (
    typeof orderId !== "string" ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  ) {
    loading.value = false;
    return;
  }
  try {
    order.value = await createOrdersApi(apiClient).getOrder(
      sessionStore.accessToken,
      orderId,
    );
  } catch (error) {
    order.value = null;
    errorMessage.value =
      error instanceof Error ? error.message : orderPageMessages.loadFailed;
  } finally {
    loading.value = false;
    syncPolling();
  }
}

function syncPolling(): void {
  if (document.hidden || order.value === null || order.value.stage === "ISSUED")
    return stopPolling();
  if (pollingTimer === null)
    pollingTimer = setInterval(
      () => void refreshOrder(),
      orderPollingIntervalMs,
    );
}
function stopPolling(): void {
  if (pollingTimer !== null) clearInterval(pollingTimer);
  pollingTimer = null;
}
async function refreshOrder(): Promise<void> {
  const orderId = route.params.id;
  if (
    typeof orderId !== "string" ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  try {
    order.value = await createOrdersApi(apiClient).getOrder(
      sessionStore.accessToken,
      orderId,
    );
    syncPolling();
  } catch {
    stopPolling();
  }
}
async function loadPushSubscription(): Promise<void> {
  if (!pushSupported.value) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    pushSubscription.value =
      subscription === null ? null : toPushSubscription(subscription);
  } catch {
    pushSubscription.value = null;
  }
}
async function enablePushNotifications(): Promise<void> {
  if (
    !pushSupported.value ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  ) {
    return;
  }
  pushOperationPending.value = true;
  pushMessage.value = null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const pushApi = createPushApi(apiClient);
    const publicKey = await pushApi.getPublicKey(sessionStore.accessToken);
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        applicationServerKey: toApplicationServerKey(publicKey),
        userVisibleOnly: true,
      }));
    const request = toPushSubscription(subscription);

    await pushApi.saveSubscription(sessionStore.accessToken, request);
    pushSubscription.value = request;
  } catch {
    pushMessage.value = orderPageMessages.pushFailed;
  } finally {
    pushOperationPending.value = false;
  }
}
async function disablePushNotifications(): Promise<void> {
  if (
    pushSubscription.value === null ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  ) {
    return;
  }
  pushOperationPending.value = true;
  pushMessage.value = null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    await createPushApi(apiClient).deleteSubscription(
      sessionStore.accessToken,
      pushSubscription.value,
    );
    if (subscription !== null) await subscription.unsubscribe();
    pushSubscription.value = null;
    pushMessage.value = orderPageMessages.pushDisabled;
  } catch {
    pushMessage.value = orderPageMessages.pushFailed;
  } finally {
    pushOperationPending.value = false;
  }
}
async function prepareRepeat(): Promise<void> {
  impossibleItems.value = [];
  if (order.value?.stage !== "ISSUED" || apiClient === undefined) return;
  try {
    const menu = await createPublicMenuApi(apiClient).getMenu();
    const prepared = createRepeatItems(
      order.value,
      menu.categories.flatMap((category) => category.products),
    );
    if (prepared === null) return;
    repeatItems = prepared;
    if (cartStore.items.length === 0) return cartStore.replace(repeatItems);
    repeatConfirmationOpen.value = true;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : orderPageMessages.loadFailed;
  }
}
async function confirmRepeat(): Promise<void> {
  cartStore.replace(repeatItems);
  repeatConfirmationOpen.value = false;
  await router.push("/cart");
}
function createRepeatItems(
  source: CustomerOrder,
  products: PublicMenuProduct[],
): Parameters<typeof cartStore.replace>[0] | null {
  const items: Parameters<typeof cartStore.replace>[0] = [];
  const impossible: string[] = [];
  for (const item of source.items) {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );
    if (product === undefined) {
      impossible.push(item.productName);
      continue;
    }
    const draft = toCartItemDraft({
      product,
      quantity: item.quantity,
      selectedModifierGroups: product.modifierGroups.map((group) => ({
        groupId: group.id,
        optionIds: item.modifiers
          .filter((modifier) =>
            group.options.some(
              (option) => option.id === modifier.modifierOptionId,
            ),
          )
          .map((modifier) => modifier.modifierOptionId),
      })),
      selectedVariantId: item.variantId,
    });
    if (draft === null) {
      impossible.push(item.productName);
      continue;
    }
    items.push({ ...draft, id: `repeat-${items.length}` });
  }
  impossibleItems.value = impossible;
  return impossible.length === 0 ? items : null;
}
function itemKey(item: OrderPageItem): string {
  return [
    item.productId,
    item.variantId ?? "other",
    ...item.modifiers.map((modifier) => modifier.modifierOptionId),
  ].join(":");
}
function toPushSubscription(
  subscription: PushSubscription,
): OrderPagePushSubscription {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  if (p256dh === null || auth === null) {
    throw new Error("Подписка браузера не содержит ключи.");
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      auth: toBase64(auth),
      p256dh: toBase64(p256dh),
    },
  };
}
function toApplicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const key = new Uint8Array(new ArrayBuffer(bytes.length));

  for (const [index, character] of Array.from(bytes).entries()) {
    key[index] = character.charCodeAt(0);
  }

  return key;
}
function toBase64(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}
</script>

<style scoped lang="scss">
.order-page {
  display: grid;
  gap: var(--customer-space-9);
  width: 100%;
  max-width: var(--customer-size-content-detail);
  margin: 0 auto;
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-17);
}
.order-page__header {
  display: grid;
  gap: var(--customer-space-4);
}
.order-page__header h1,
.order-page__stage,
.order-page__payment,
.order-page__notifications h2,
.order-page__alert p,
.order-page__alert ul {
  margin: 0;
}
.order-page__header h1 {
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}
.order-page__stage {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.order-page__state {
  display: grid;
  min-height: 15rem;
  place-items: center;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
  text-align: center;
}
.order-page__items {
  display: grid;
  gap: var(--customer-space-6);
  padding: 0;
  margin: 0;
  list-style: none;
}
.order-page__items li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--customer-space-9);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
}
.order-page__item-main {
  display: grid;
  min-width: 0;
  gap: var(--customer-space-3);
}
.order-page__item-main strong {
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  overflow-wrap: anywhere;
}
.order-page__item-main span,
.order-page__item-main p {
  margin: 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.order-page__item-main p {
  font-size: var(--customer-font-size-xs);
}
.order-page__item-total {
  flex: 0 0 auto;
  color: var(--customer-color-blue-500);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-black);
  white-space: nowrap;
}
.order-page__total {
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
  font-size: var(--customer-font-size-lg);
}
.order-page__total strong {
  color: var(--customer-color-blue-500);
  font-weight: var(--customer-font-weight-black);
}
.order-page__payment {
  padding: 0 var(--customer-space-10);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}
.order-page__notifications {
  display: grid;
  gap: var(--customer-space-5);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
}
.order-page__notifications h2 {
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
}
.order-page__notifications p {
  margin: 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
}
.order-page__notifications .ui-btn,
.order-page__repeat {
  justify-self: start;
  padding: 0 var(--customer-space-10);
  color: var(--customer-text);
  background: var(--customer-primary);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
.order-page__repeat[color="surface"] {
  color: var(--customer-background);
  background: var(--customer-surface);
}
.order-page__alert {
  display: grid;
  gap: var(--customer-space-5);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-color-warning-surface);
  border-radius: var(--customer-radius-lg);
}
.order-page__alert ul {
  padding-left: var(--customer-space-10);
}
.order-page__dialog {
  display: grid;
  gap: var(--customer-space-5);
  padding: var(--customer-space-9);
  background: var(--customer-background);
}
@media (min-width: 1024px) {
  .order-page {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
