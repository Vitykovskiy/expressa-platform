<template>
  <section class="order-page" aria-labelledby="order-title">
    <div v-if="loading" class="order-page__state" role="status">
      Загружаем заказ
    </div>
    <template v-else-if="order">
      <header class="order-page__header">
        <p class="order-page__number">Заказ №{{ order.number }}</p>
        <h1 id="order-title">{{ stageLabel }}</h1>
        <p class="order-page__stage-hint">{{ stageHint }}</p>
      </header>
      <p
        v-if="refreshFeedback === 'pending'"
        class="order-page__refresh-status"
        role="status"
      >
        {{ orderPageMessages.refreshing }}
      </p>
      <section
        v-else-if="refreshFeedback === 'stale'"
        class="order-page__refresh-status"
        role="alert"
      >
        <p>{{ refreshErrorMessage }}</p>
        <p>{{ orderPageMessages.staleData }}</p>
        <ui-btn
          :disabled="detailRequestPending"
          type="button"
          @click="recoverOrder"
        >
          Повторить обновление
        </ui-btn>
      </section>
      <ul class="order-page__items" aria-label="Состав заказа">
        <li v-for="item in order.items" :key="itemKey(item)">
          <div class="order-page__item-main">
            <strong>{{ item.productName }}</strong>
            <span
              >{{ item.quantity }} × {{ formatRubles(item.unitTotal) }}</span
            >
            <p v-if="item.size">Размер {{ item.size }}</p>
            <p
              v-for="modifier in item.modifiers"
              :key="modifier.modifierOptionId"
            >
              + {{ modifier.modifierName }}
            </p>
          </div>
          <strong
            class="order-page__item-total"
            data-testid="order-item-line-total"
            >{{ formatRubles(item.lineTotal) }}</strong
          >
        </li>
      </ul>
      <p class="order-page__total">
        <span>Итого</span
        ><strong data-testid="order-total">{{
          formatRubles(order.total)
        }}</strong>
      </p>
      <p class="order-page__payment">Оплата на кассе при получении</p>
      <ui-btn
        v-if="order.stage === 'ISSUED'"
        ref="repeatTrigger"
        class="order-page__repeat"
        :loading="repeatPreparationPending"
        type="button"
        @click="prepareRepeat"
      >
        Повторить заказ
      </ui-btn>
      <p v-if="repeatPreparationPending" role="status">
        {{ orderPageMessages.repeatPreparing }}
      </p>
      <section
        class="order-page__notifications"
        aria-labelledby="notifications-title"
      >
        <h2 id="notifications-title">Уведомления о заказе</h2>
        <p v-if="!pushSupported">{{ orderPageMessages.pushUnsupported }}</p>
        <template v-else>
          <p v-if="pushOperationPending" role="status">
            {{ orderPageMessages.pushPreparing }}
          </p>
          <p v-else-if="pushMessage" role="status">{{ pushMessage }}</p>
          <ui-btn
            v-if="pushSubscription === null"
            :loading="pushOperationPending"
            type="button"
            @click="enablePushNotifications"
          >
            Включить уведомления
          </ui-btn>
          <ui-btn
            v-else
            :loading="pushOperationPending"
            type="button"
            @click="disablePushNotifications"
          >
            Отключить уведомления
          </ui-btn>
        </template>
      </section>
    </template>
    <div v-else class="order-page__state" role="alert">
      <h1 id="order-title">Заказ</h1>
      <p>{{ errorMessage ?? orderPageMessages.unavailable }}</p>
      <ui-btn
        v-if="initialRecoveryAvailable"
        :disabled="detailRequestPending"
        type="button"
        @click="recoverOrder"
      >
        Повторить
      </ui-btn>
      <div v-else class="order-page__terminal-actions">
        <ui-btn to="/orders" type="button">К истории заказов</ui-btn>
        <ui-btn to="/" type="button">Перейти в меню</ui-btn>
      </div>
    </div>
    <ui-dialog
      v-model="repeatConfirmationOpen"
      label="Подтверждение замены корзины"
      max-width="32rem"
      :return-focus-to="repeatTrigger"
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
import type { ConfiguredCartItemDraft } from "@/entities/customer/model/customer.types";
import { formatRubles } from "@/entities/customer/model/money";
import { toCartItemDraft } from "@/features/menu/product-configuration";
import {
  createPublicMenuApi,
  type PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import { ApiError, apiClientKey } from "@/shared/api/client";
import { createOrdersApi, type CustomerOrder } from "@/shared/api/orders.api";
import { createPushApi } from "@/shared/api/push.api";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiDialog from "@/shared/ui/customer/dialog/UiDialog.vue";
import {
  orderPageMessages,
  orderPageStageHints,
  orderPageStageLabels,
  orderPollingIntervalMs,
} from "./OrderPage.constants";
import type {
  OrderPageItem,
  OrderPageOrder,
  OrderPagePushSubscription,
  OrderRepeatPreparation,
} from "./OrderPage.types";

const route = useRoute();
const router = useRouter();
const apiClient = inject(apiClientKey);
const sessionStore = useSessionStore();
const cartStore = useCartStore();
const order = ref<OrderPageOrder | null>(null);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const refreshErrorMessage = ref<string | null>(null);
const refreshFeedback = ref<"pending" | "stale" | null>(null);
const detailRequestPending = ref(false);
const initialRecoveryAvailable = ref(false);
const pushMessage = ref<string | null>(null);
const pushOperationPending = ref(false);
const pushSubscription = ref<OrderPagePushSubscription | null>(null);
const repeatConfirmationOpen = ref(false);
const repeatPreparationPending = ref(false);
const repeatTrigger = ref<InstanceType<typeof UiBtn> | null>(null);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let repeatPreparation: OrderRepeatPreparation | null = null;
let detailRequestOwner = 0;
let repeatOperationOwner = 0;
let isMounted = false;
const stageLabel = computed(() =>
  order.value === null ? "" : orderPageStageLabels[order.value.stage],
);
const stageHint = computed(() =>
  order.value === null ? "" : orderPageStageHints[order.value.stage],
);
const pushSupported = computed(
  () => "serviceWorker" in navigator && "PushManager" in window,
);

onMounted(() => {
  isMounted = true;
  document.addEventListener("visibilitychange", syncPolling);
  void loadPushSubscription();
  void loadInitialOrder();
});
onUnmounted(() => {
  isMounted = false;
  detailRequestOwner += 1;
  repeatOperationOwner += 1;
  document.removeEventListener("visibilitychange", syncPolling);
  stopPolling();
});
watch(
  () => route.params.id,
  () => {
    repeatOperationOwner += 1;
    repeatPreparationPending.value = false;
    void loadInitialOrder();
  },
);

async function loadInitialOrder(): Promise<void> {
  stopPolling();
  const owner = beginDetailRequest();
  loading.value = true;
  order.value = null;
  errorMessage.value = null;
  initialRecoveryAvailable.value = false;
  refreshErrorMessage.value = null;
  refreshFeedback.value = null;
  const orderId = route.params.id;
  if (
    typeof orderId !== "string" ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  ) {
    finishInitialRequest(owner);
    return;
  }
  try {
    const nextOrder = await createOrdersApi(apiClient).getOrder(
      sessionStore.accessToken,
      orderId,
    );
    if (!ownsDetailRequest(owner)) return;
    order.value = nextOrder;
    await startRequestedRepeat(nextOrder);
  } catch (error) {
    if (!ownsDetailRequest(owner)) return;
    order.value = null;
    errorMessage.value =
      error instanceof ApiError && error.code === "ORDER_NOT_FOUND"
        ? orderPageMessages.unavailable
        : orderPageMessages.loadFailed;
    initialRecoveryAvailable.value =
      errorMessage.value !== orderPageMessages.unavailable;
  } finally {
    finishInitialRequest(owner);
  }
}
async function startRequestedRepeat(nextOrder: OrderPageOrder): Promise<void> {
  if (route.query.repeat !== "1" || nextOrder.stage !== "ISSUED") return;
  await router.replace({ path: route.path, query: {} });
  await prepareRepeat();
}

function syncPolling(): void {
  if (
    document.hidden ||
    detailRequestPending.value ||
    refreshFeedback.value === "stale" ||
    order.value === null ||
    order.value.stage === "ISSUED"
  )
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
  if (detailRequestPending.value) return;
  const orderId = route.params.id;
  if (
    typeof orderId !== "string" ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  const owner = beginDetailRequest();
  refreshFeedback.value = "pending";
  refreshErrorMessage.value = null;
  try {
    const nextOrder = await createOrdersApi(apiClient).getOrder(
      sessionStore.accessToken,
      orderId,
    );
    if (!ownsDetailRequest(owner)) return;
    order.value = nextOrder;
    refreshFeedback.value = null;
  } catch (error) {
    if (!ownsDetailRequest(owner)) return;
    refreshErrorMessage.value =
      error instanceof ApiError && error.code === "ORDER_NOT_FOUND"
        ? orderPageMessages.unavailable
        : orderPageMessages.refreshFailed;
    refreshFeedback.value = "stale";
    stopPolling();
  } finally {
    finishRefreshRequest(owner);
  }
}
function recoverOrder(): void {
  if (detailRequestPending.value) return;
  if (initialRecoveryAvailable.value) {
    void loadInitialOrder();
    return;
  }
  if (refreshFeedback.value === "stale") void refreshOrder();
}
function beginDetailRequest(): number {
  detailRequestOwner += 1;
  detailRequestPending.value = true;
  return detailRequestOwner;
}
function ownsDetailRequest(owner: number): boolean {
  return isMounted && detailRequestOwner === owner;
}
function finishInitialRequest(owner: number): void {
  if (!ownsDetailRequest(owner)) return;
  detailRequestPending.value = false;
  loading.value = false;
  syncPolling();
}
function finishRefreshRequest(owner: number): void {
  if (!ownsDetailRequest(owner)) return;
  detailRequestPending.value = false;
  syncPolling();
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
  if (repeatPreparationPending.value) return;
  cartStore.clearRepeatWarnings();
  if (order.value?.stage !== "ISSUED" || apiClient === undefined) return;
  const owner = ++repeatOperationOwner;
  repeatPreparationPending.value = true;
  try {
    const menu = await createPublicMenuApi(apiClient).getMenu();
    if (!ownsRepeatOperation(owner)) return;
    const preparation = createRepeatItems(
      order.value,
      menu.categories.flatMap((category) => category.products),
    );
    repeatPreparation = preparation;
    if (cartStore.items.length === 0) {
      return applyRepeatAndOpenCart(preparation);
    }
    if (preparation.items.length === 0) {
      return applyRepeatAndOpenCart(preparation);
    }
    repeatConfirmationOpen.value = true;
  } catch (error) {
    if (!ownsRepeatOperation(owner)) return;
    errorMessage.value =
      error instanceof Error ? error.message : orderPageMessages.loadFailed;
  } finally {
    if (ownsRepeatOperation(owner)) repeatPreparationPending.value = false;
  }
}
function ownsRepeatOperation(owner: number): boolean {
  return isMounted && repeatOperationOwner === owner;
}
async function confirmRepeat(): Promise<void> {
  if (repeatPreparation === null) return;
  cartStore.applyRepeat(
    repeatPreparation.items,
    repeatPreparation.warnings,
    repeatPreparation.result,
  );
  repeatConfirmationOpen.value = false;
  await router.push("/cart");
}
async function applyRepeatAndOpenCart(
  preparation: OrderRepeatPreparation,
): Promise<void> {
  cartStore.applyRepeat(
    preparation.items,
    preparation.warnings,
    preparation.result,
  );
  await router.push("/cart");
}
function createRepeatItems(
  source: CustomerOrder,
  products: PublicMenuProduct[],
): OrderRepeatPreparation {
  const items: OrderRepeatPreparation["items"] = [];
  const warnings: OrderRepeatPreparation["warnings"] = [];
  for (const item of source.items) {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );
    if (product === undefined || !product.isAvailable) {
      warnings.push({
        productName: item.productName,
        reason: orderPageMessages.repeatProductUnavailable,
      });
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
    if (draft === null || !doesDraftPreserveModifiers(draft, item)) {
      warnings.push({
        productName: item.productName,
        context: getRepeatConfigurationContext(item),
        reason: orderPageMessages.repeatConfigurationUnavailable,
      });
      continue;
    }
    items.push({ ...draft, id: `repeat-${items.length}` });
  }
  return {
    items,
    result: {
      addedPositionCount: items.length,
      requestedPositionCount: source.items.length,
    },
    warnings,
  };
}
function doesDraftPreserveModifiers(
  draft: ConfiguredCartItemDraft,
  item: OrderPageItem,
): boolean {
  return (
    draft.selectedModifierOptions.length === item.modifiers.length &&
    item.modifiers.every((modifier) =>
      draft.selectedModifierOptions.some(
        (option) => option.id === modifier.modifierOptionId,
      ),
    )
  );
}
function getRepeatConfigurationContext(
  item: OrderPageItem,
): string | undefined {
  const details = [
    item.size === null ? null : `Размер ${item.size}`,
    ...item.modifiers.map((modifier) => modifier.modifierName),
  ].filter((detail): detail is string => detail !== null);

  return details.length === 0 ? undefined : details.join(", ");
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
.order-page__number,
.order-page__stage-hint,
.order-page__payment,
.order-page__notifications h2 {
  margin: 0;
}
.order-page__header h1,
.order-page__state h1 {
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-page-heading);
}
.order-page__number {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.order-page__stage-hint {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.order-page__state {
  display: grid;
  gap: var(--customer-space-7);
  min-height: 15rem;
  place-items: center;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
  text-align: center;
}
.order-page__state p {
  margin: 0;
}
.order-page__terminal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--customer-space-5);
  justify-content: center;
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
.order-page__notifications .ui-btn {
  color: var(--customer-primary);
  background: var(--customer-surface);
  border: 1px solid var(--customer-border-subtle-on-surface);
}
.order-page__dialog {
  display: grid;
  gap: var(--customer-space-5);
  padding: var(--customer-space-9);
  background: var(--customer-background);
  border-radius: var(--customer-radius-lg);
}
@media (min-width: 1024px) {
  .order-page {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
