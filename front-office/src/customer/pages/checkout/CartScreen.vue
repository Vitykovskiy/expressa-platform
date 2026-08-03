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
          :item="item"
          @remove-item="emit('removeItem', $event)"
          @update-quantity="
            (itemId, nextQuantity) =>
              emit('updateQuantity', itemId, nextQuantity)
          "
        />
      </ul>

      <div class="cart-screen__mobile-total" aria-label="Итого заказа">
        <span>Итого</span>
        <strong>{{ totalRub }} ₽</strong>
      </div>

      <aside class="cart-screen__summary" aria-label="Сводка заказа">
        <p class="cart-screen__summary-label">Сводка заказа</p>
        <p class="cart-screen__summary-row">
          <span>{{ cartItemLabel }}</span
          ><strong>{{ totalQuantity }}</strong>
        </p>
        <p class="cart-screen__total">
          <span>Итого</span><strong>{{ totalRub }} ₽</strong>
        </p>
        <ui-btn
          block
          class="cart-screen__checkout"
          size="x-large"
          @click="emit('checkout')"
        >
          Оформить заказ
        </ui-btn>
      </aside>
    </div>

    <footer v-if="items.length" class="cart-screen__mobile-checkout">
      <ui-btn
        block
        class="cart-screen__checkout"
        size="x-large"
        @click="emit('checkout')"
      >
        Оформить заказ · {{ totalRub }} ₽
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

const props = defineProps<CartScreenProps>();

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
  align-items: center;
  gap: var(--customer-space-9);
  padding: var(--customer-space-9);
  background: var(--customer-background);
  border-top: 1px solid var(--customer-border);
}
@media (min-width: 1024px) {
  .cart-screen__header {
    padding: var(--customer-space-13) var(--customer-space-16)
      var(--customer-space-15);
  }
  .cart-screen__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--customer-size-summary);
    align-items: start;
    gap: var(--customer-space-16);
    padding: 0 var(--customer-space-16) var(--customer-space-16);
  }
  .cart-screen__mobile-total {
    display: none;
  }
  .cart-screen__summary {
    display: block;
    position: sticky;
    top: var(--customer-space-11);
  }
  .cart-screen__mobile-checkout {
    display: none;
  }
}
</style>
