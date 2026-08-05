<template>
  <section class="cart-screen" aria-labelledby="cart-title">
    <header class="cart-screen__header">
      <p class="cart-screen__eyebrow">
        {{ totalQuantity }} {{ cartItemLabel }}
      </p>
      <h1 id="cart-title" class="cart-screen__title">Корзина</h1>
    </header>

    <div v-if="items.length === 0" class="cart-screen__empty" role="status">
      <div class="cart-screen__empty-icon" aria-hidden="true">
        <ShoppingCart class="cart-screen__empty-icon-glyph" />
      </div>
      <p class="cart-screen__empty-message">Пока ничего не добавлено</p>
      <ui-btn color="surface" size="large" @click="emit('continueShopping')">
        Перейти в меню
      </ui-btn>
    </div>

    <div v-else class="cart-screen__content">
      <ul class="cart-screen__items" aria-label="Позиции в корзине">
        <CartItem
          v-for="item in items"
          :key="item.id"
          :disabled="isSubmitting"
          :item="item"
          :price-outdated="needsReconfirmation"
          :unavailable="unavailableItemIdSet.has(item.id)"
          @remove-item="emit('removeItem', $event)"
          @update-quantity="
            (itemId, nextQuantity) =>
              emit('updateQuantity', itemId, nextQuantity)
          "
        />
      </ul>

      <div
        v-if="hasCheckoutMessage"
        class="cart-screen__notice"
        :class="noticeClass"
        role="status"
      >
        <strong>{{ noticeTitle }}</strong>
        <span>{{ noticeMessage }}</span>
      </div>

      <div
        v-if="needsReconfirmation"
        class="cart-screen__mobile-total cart-screen__mobile-total--changed"
        aria-label="Изменение итога заказа"
      >
        <span>Предыдущий итог</span>
        <s>{{ totalRub }} ₽</s>
        <span>Новый итог</span>
        <strong>{{ checkoutTotalRub }} ₽</strong>
      </div>
      <div v-else class="cart-screen__mobile-total" aria-label="Итого заказа">
        <span>Итого</span>
        <strong>{{ totalRub }} ₽</strong>
      </div>

      <aside class="cart-screen__summary" aria-label="Сводка заказа">
        <p class="cart-screen__summary-label">Сводка заказа</p>
        <p class="cart-screen__summary-row">
          <span>{{ cartItemLabel }}</span
          ><strong>{{ totalQuantity }}</strong>
        </p>
        <template v-if="needsReconfirmation">
          <p class="cart-screen__total cart-screen__total--previous">
            <span>Предыдущий итог</span><s>{{ totalRub }} ₽</s>
          </p>
          <p class="cart-screen__total cart-screen__total--changed">
            <span>Новый итог</span><strong>{{ checkoutTotalRub }} ₽</strong>
          </p>
        </template>
        <p v-else class="cart-screen__total">
          <span>Итого</span><strong>{{ totalRub }} ₽</strong>
        </p>
        <p class="cart-screen__payment">Оплата на кассе при получении</p>
        <ui-btn
          block
          class="cart-screen__checkout"
          size="x-large"
          :disabled="isCheckoutDisabled"
          :loading="isSubmitting"
          @click="emitCheckout"
        >
          {{ checkoutLabel }}
        </ui-btn>
      </aside>
    </div>

    <footer v-if="items.length" class="cart-screen__mobile-checkout">
      <p class="cart-screen__mobile-payment">Оплата на кассе при получении</p>
      <ui-btn
        block
        class="cart-screen__checkout"
        size="x-large"
        :disabled="isCheckoutDisabled"
        :loading="isSubmitting"
        @click="emitCheckout"
      >
        {{ mobileCheckoutLabel }}
      </ui-btn>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ShoppingCart } from "lucide-vue-next";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import CartItem from "./CartItem.vue";
import type { CartScreenEmits, CartScreenProps } from "./CartScreen.types";

const { acceptsNewOrders = true, ...props } = defineProps<CartScreenProps>();

const emit = defineEmits<CartScreenEmits>();

const totalQuantity = computed(() =>
  props.items.reduce((sum, item) => sum + item.quantity, 0),
);
const cartItemLabel = computed(() => {
  const lastTwoDigits = totalQuantity.value % 100;
  const lastDigit = totalQuantity.value % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "товаров";
  if (lastDigit === 1) return "товар";
  if (lastDigit >= 2 && lastDigit <= 4) return "товара";

  return "товаров";
});
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
const needsReconfirmation = computed(
  () => props.checkoutState === "reconfirmation-required",
);
const isCheckoutDisabled = computed(
  () =>
    !acceptsNewOrders ||
    isSubmitting.value ||
    unavailableItemIdSet.value.size > 0,
);
const hasCheckoutMessage = computed(
  () =>
    !acceptsNewOrders ||
    needsReconfirmation.value ||
    props.checkoutState === "error" ||
    unavailableItemIdSet.value.size > 0,
);
const noticeTitle = computed(() => {
  if (!acceptsNewOrders) return "Заказы временно недоступны";
  if (unavailableItemIdSet.value.size > 0) return "Проверьте корзину";
  if (needsReconfirmation.value) return "Итог изменился";
  return "Не удалось оформить заказ";
});
const noticeMessage = computed(() => {
  if (!acceptsNewOrders)
    return props.errorMessage ?? "Приём новых заказов сейчас закрыт.";
  if (unavailableItemIdSet.value.size > 0)
    return "Удалите недоступные позиции, чтобы продолжить.";
  if (props.checkoutState === "reconfirmation-required")
    return "Проверьте предыдущий и новый итог, затем подтвердите заказ ещё раз.";
  return props.errorMessage ?? "Попробуйте ещё раз.";
});
const noticeClass = computed(() => ({
  "cart-screen__notice--warning":
    acceptsNewOrders &&
    needsReconfirmation.value &&
    unavailableItemIdSet.value.size === 0,
  "cart-screen__notice--error":
    !acceptsNewOrders ||
    !needsReconfirmation.value ||
    unavailableItemIdSet.value.size > 0,
}));
const checkoutLabel = computed(() => {
  if (isSubmitting.value) return "Оформляем заказ";
  if (needsReconfirmation.value) return "Подтвердить новый итог";
  return "Оформить заказ";
});
const mobileCheckoutLabel = computed(
  () => `${checkoutLabel.value} · ${checkoutTotalRub.value} ₽`,
);

function emitCheckout(): void {
  if (isCheckoutDisabled.value) return;

  if (needsReconfirmation.value) {
    emit("reconfirm");
    return;
  }

  emit("checkout");
}
</script>

<style scoped lang="scss">
.cart-screen {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  color: var(--customer-text);
  background: var(--customer-background);
}
.cart-screen__header {
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-15);
}
.cart-screen__eyebrow,
.cart-screen__summary-label {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.cart-screen__title {
  margin-top: 0;
  margin-bottom: 0;
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}
.cart-screen__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--customer-space-11);
  padding: var(--customer-space-18) var(--customer-space-9);
  text-align: center;
}
.cart-screen__empty-icon {
  display: grid;
  width: calc(var(--customer-font-size-7xl) + var(--customer-space-11) * 2);
  height: calc(var(--customer-font-size-7xl) + var(--customer-space-11) * 2);
  padding: var(--customer-space-11);
  place-items: center;
  border-radius: var(--customer-radius-round);
  background: var(--customer-color-surface-subtle);
}
.cart-screen__empty-icon-glyph {
  width: var(--customer-font-size-7xl);
  height: var(--customer-font-size-7xl);
  color: var(--customer-color-text-on-brand);
}
.cart-screen__empty-message {
  margin-top: 0;
  margin-bottom: 0;
  color: var(--customer-color-text-muted-on-brand);
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-9);
  padding: var(--customer-space-11) var(--customer-space-9)
    var(--customer-space-13);
}
.cart-screen__items {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.cart-screen__mobile-total {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: var(--customer-space-9) var(--customer-space-11);
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__mobile-total--changed {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--customer-space-4) var(--customer-space-7);
}
.cart-screen__mobile-total s {
  color: var(--customer-color-text-muted-on-brand);
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__notice {
  display: grid;
  gap: var(--customer-space-3);
  padding: var(--customer-space-8) var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-left: var(--customer-space-2) solid var(--customer-danger);
  border-radius: var(--customer-radius-sm);
}
.cart-screen__notice--warning {
  border-left-color: var(--customer-primary);
}
.cart-screen__notice span {
  color: var(--customer-color-text-muted-on-surface);
}
.cart-screen__mobile-total strong {
  font-size: var(--customer-font-size-4xl);
  font-weight: var(--customer-font-weight-black);
}
.cart-screen__summary {
  display: none;
  padding: var(--customer-space-12);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-surface);
}
.cart-screen__summary-label {
  color: var(--customer-color-text-muted-on-surface);
}
.cart-screen__summary-row,
.cart-screen__total {
  display: flex;
  justify-content: space-between;
  margin-top: 0;
  margin-bottom: 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__total--previous {
  color: var(--customer-color-text-muted-on-surface);
}
.cart-screen__total--previous s {
  font-weight: var(--customer-font-weight-bold);
}
.cart-screen__total--changed {
  margin-top: var(--customer-space-5);
  padding-top: 0;
  border-top: 0;
}
.cart-screen__summary-row strong {
  color: var(--customer-text-on-surface);
}
.cart-screen__total {
  margin-top: var(--customer-space-8);
  padding-top: var(--customer-space-8);
  border-top: 1px solid var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
}
.cart-screen__total strong {
  color: var(--customer-background);
  font-size: var(--customer-font-size-5xl);
  font-weight: var(--customer-font-weight-black);
}
.cart-screen__payment {
  margin: var(--customer-space-6) 0 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.cart-screen__checkout {
  margin-top: var(--customer-space-9);
  font-weight: var(--customer-font-weight-black);
}
.cart-screen__checkout {
  color: var(--customer-text);
  background: var(--customer-primary);
}
.cart-screen__mobile-checkout {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  gap: var(--customer-space-9);
  padding: var(--customer-space-9);
  background: var(--customer-background);
  border-top: 1px solid var(--customer-border);
}
.cart-screen__mobile-payment {
  margin: 0;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
  text-align: center;
}
@media (min-width: 1024px) {
  .cart-screen__header {
    padding: var(--customer-space-13) var(--customer-space-16)
      var(--customer-space-15);
  }
  .cart-screen__content {
    display: grid;
    grid-template-areas:
      "items summary"
      "notice summary";
    grid-template-columns: minmax(0, 1fr) var(--customer-size-summary);
    align-items: start;
    align-content: start;
    gap: var(--customer-space-16);
    padding: 0 var(--customer-space-16) var(--customer-space-16);
  }
  .cart-screen__items {
    grid-area: items;
  }
  .cart-screen__notice {
    grid-area: notice;
  }
  .cart-screen__mobile-total {
    display: none;
  }
  .cart-screen__summary {
    display: block;
    position: sticky;
    grid-area: summary;
    top: var(--customer-space-11);
  }
  .cart-screen__mobile-checkout {
    display: none;
  }
}
</style>
