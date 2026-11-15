<template>
  <section class="cart-screen" aria-labelledby="cart-title">
    <header class="cart-screen__header">
      <h1 id="cart-title" class="cart-screen__title">Корзина</h1>
    </header>
    <div v-if="items.length === 0" class="cart-screen__empty" role="status">
      <ShoppingCart class="cart-screen__empty-icon" aria-hidden="true" />
      <p class="cart-screen__empty-message">Пока ничего не добавлено</p>
      <UiBtn class="cart-screen__empty-action" @click="emit('continueShopping')"
        >Перейти в меню</UiBtn
      >
    </div>
    <div v-else class="cart-screen__content">
      <ul
        ref="itemList"
        class="cart-screen__items"
        aria-label="Позиции в корзине"
      >
        <CartItem
          v-for="item in items"
          :key="item.id"
          :disabled="isEditingLocked"
          :item="item"
          :price-outdated="needsReconfirmation"
          :unavailable="unavailableItemIdSet.has(item.id)"
          @edit-item="editItem"
          @remove-item="emit('removeItem', $event)"
          @update-quantity="
            (itemId, quantity) => emit('updateQuantity', itemId, quantity)
          "
        />
      </ul>
      <footer
        class="cart-screen__checkout-footer"
        aria-label="Оформление заказа"
      >
        <div class="cart-screen__summary">
          <p class="cart-screen__total">
            <span>Итого</span
            ><strong>{{ formatRubles(checkoutTotalRub) }}</strong>
          </p>
          <p class="cart-screen__payment">Оплата на кассе при получении</p>
        </div>
        <div class="cart-screen__actions">
          <div
            v-if="isIntakeUnavailable"
            class="cart-screen__closed"
            role="status"
          >
            <span class="cart-screen__intake-copy">
              <span>{{ intakeMessage }}</span>
              <small v-if="intakeRecoveryMessage">{{
                intakeRecoveryMessage
              }}</small>
            </span>
            <UiIconBtn
              class="cart-screen__refresh"
              aria-label="Обновить"
              :aria-busy="isIntakeChecking || undefined"
              :disabled="isRefreshDisabled"
              @click="emit('recheckAvailability')"
              ><RefreshCw :size="20" aria-hidden="true"
            /></UiIconBtn>
          </div>
          <UiBtn
            block
            class="cart-screen__checkout"
            :disabled="isCheckoutDisabled"
            :loading="isSubmitting"
            @click="emitCheckout"
            >{{ checkoutLabel }}</UiBtn
          >
        </div>
      </footer>
    </div>
    <UiNotification
      :message="notificationMessage"
      :role="needsReconfirmation ? 'status' : 'alert'"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { RefreshCw, ShoppingCart } from "lucide-vue-next";
import { formatRubles } from "@/entities/customer/model/money";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import UiNotification from "@/shared/ui/customer/notification/UiNotification.vue";
import CartItem from "./CartItem.vue";
import { checkoutMessages } from "./checkout.store.constants";
import type { CartScreenEmits, CartScreenProps } from "./CartScreen.types";

const props = defineProps<CartScreenProps>();
const emit = defineEmits<CartScreenEmits>();
const itemList = useTemplateRef<HTMLUListElement>("itemList");

const totalRub = computed(() =>
  props.items.reduce((sum, item) => sum + item.lineTotalRub, 0),
);
const checkoutTotalRub = computed(() =>
  props.checkoutState === "reconfirmation-required"
    ? props.reconfirmedTotalRub
    : totalRub.value,
);
const unavailableItemIdSet = computed(
  () => new Set(props.unavailableItemIds ?? []),
);
const isSubmitting = computed(() => props.checkoutState === "submitting");
const isEditingLocked = computed(
  () => isSubmitting.value || props.itemsLocked === true,
);
const isIntakeUnavailable = computed(() => props.acceptsNewOrders === false);
const isIntakeChecking = computed(
  () => props.intakeRecovery?.status === "pending",
);
const isRefreshDisabled = computed(
  () => isEditingLocked.value || isIntakeChecking.value,
);
const intakeMessage = computed(() => {
  if (props.intakeRecovery?.confirmedClosed !== false) {
    return "Сейчас не принимаем заказы";
  }

  return "Приём заказов не подтверждён";
});
const intakeRecoveryMessage = computed(() => {
  if (isIntakeChecking.value) {
    return "Обновляем…";
  }

  if (props.intakeRecovery?.status === "failed") {
    return "Не удалось обновить. Попробуйте ещё раз";
  }

  return null;
});
const needsReconfirmation = computed(
  () => props.checkoutState === "reconfirmation-required",
);
const isCheckoutDisabled = computed(
  () =>
    isIntakeUnavailable.value ||
    isSubmitting.value ||
    unavailableItemIdSet.value.size > 0,
);
const notificationMessage = computed(() => {
  if (isIntakeUnavailable.value) {
    return null;
  }

  if (unavailableItemIdSet.value.size > 0) {
    return "Удалите недоступные позиции, чтобы оформить заказ";
  }

  if (needsReconfirmation.value) {
    return "Сумма заказа изменилась";
  }

  if (props.checkoutState === "error") {
    if (
      props.errorMessage === checkoutMessages.orderFailed ||
      props.errorMessage === checkoutMessages.retryFailed
    ) {
      return "Не удалось оформить заказ. Попробуйте ещё раз";
    }

    return (
      props.errorMessage ?? "Не удалось оформить заказ. Попробуйте ещё раз"
    );
  }

  return null;
});
const checkoutLabel = computed(() => {
  if (isSubmitting.value) {
    return "Оформляем заказ";
  }

  if (props.requiresPhoneConfirmation) {
    return "Подтвердить телефон";
  }

  return "Оформить заказ";
});

onMounted(() => {
  if (itemList.value !== null) {
    // Браузер ограничивает восстановленное значение при укороченном списке.
    itemList.value.scrollTop = props.listScrollTop ?? 0;
  }
});

function editItem(itemId: string): void {
  if (isEditingLocked.value || itemList.value === null) {
    return;
  }

  emit("editItem", itemId, itemList.value.scrollTop);
}

function emitCheckout(): void {
  if (isCheckoutDisabled.value) {
    return;
  }

  if (needsReconfirmation.value) {
    emit("reconfirm");

    return;
  }

  emit("checkout");
}
</script>

<style scoped>
.cart-screen {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-9);
  width: 100%;
  max-width: 55rem; /* Ширина области 880px из принятого макета; отдельного токена нет. */
  height: calc(100dvh - var(--customer-size-shell-header));
  min-height: 0;
  padding: var(--customer-space-13) var(--customer-space-9)
    max(var(--customer-space-9), env(safe-area-inset-bottom));
  color: var(--customer-text);
}
.cart-screen__header {
  flex: 0 0 auto;
}
.cart-screen__title {
  margin: 0;
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
  line-height: var(--customer-line-height-page-heading);
}
.cart-screen__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-9);
  min-height: 0;
}
.cart-screen__items {
  flex: 0 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0 var(--customer-space-9);
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-xl);
}
.cart-screen__checkout-footer {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--customer-space-7);
  margin-top: auto;
  padding: var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-xl);
}
.cart-screen__intake-copy {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-2);
  min-width: 0;
}
.cart-screen__intake-copy small {
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}
.cart-screen__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-7);
  margin: 0;
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__total strong {
  font-size: var(--customer-font-size-5xl);
  font-weight: var(--customer-font-weight-extrabold);
}
.cart-screen__payment {
  margin: var(--customer-space-3) 0 0;
  color: var(--customer-color-text-secondary-on-surface);
  font-size: var(--customer-font-size-xs);
}
.cart-screen__actions {
  display: grid;
  gap: var(--customer-space-5);
}
.cart-screen__closed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-3);
  font-size: var(--customer-font-size-sm);
}
.cart-screen__refresh {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
}
.cart-screen__refresh:hover:not(:disabled) {
  background: var(--customer-surface-info);
}
.cart-screen__checkout {
  min-height: var(--customer-size-control-xl);
  color: var(--customer-text);
  background: var(--customer-primary);
  border-radius: var(--customer-radius-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
.cart-screen__empty {
  display: grid;
  flex: 1;
  align-content: center;
  justify-items: center;
  gap: var(--customer-space-9);
  text-align: center;
}
.cart-screen__empty-icon {
  width: var(--customer-size-state-icon);
  height: var(--customer-size-state-icon);
}
.cart-screen__empty-message {
  margin: 0;
}
.cart-screen__empty-action {
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
}
@media (min-width: 1024px) {
  .cart-screen {
    height: calc(100dvh - var(--customer-space-9));
    padding: var(--customer-space-17) 0 var(--customer-space-13);
  }
  .cart-screen__content {
    flex: 0 1 auto;
    gap: 0;
    background: var(--customer-surface);
    border-radius: var(--customer-radius-xl);
    overflow: hidden;
  }
  .cart-screen__items {
    padding-inline: var(--customer-space-13);
    border-radius: 0;
  }
  .cart-screen__checkout-footer {
    flex-direction: row;
    align-items: center;
    gap: var(--customer-space-13);
    margin: 0 var(--customer-space-13);
    padding: var(--customer-space-13) 0;
    border-top: 1px solid var(--customer-border-subtle-on-surface);
    border-radius: 0;
  }
  .cart-screen__summary {
    flex: 1;
    min-width: 0;
  }
  .cart-screen__actions {
    flex: 0 0 18.25rem; /* Ширина блока действий 292px из принятого макета; отдельного токена нет. */
  }
  .cart-screen__total strong {
    font-size: var(--customer-font-size-3xl);
  }
}
</style>
