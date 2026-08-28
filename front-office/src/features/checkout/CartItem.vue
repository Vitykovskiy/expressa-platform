<template>
  <li
    class="cart-item"
    :class="{ 'cart-item--unavailable': props.unavailable }"
    :aria-busy="props.disabled"
    :aria-describedby="props.unavailable ? unavailableMessageId : undefined"
    :aria-label="`Позиция корзины: ${props.item.productName}`"
  >
    <div class="cart-item__details">
      <div class="cart-item__title">
        <h2 class="cart-item__name">
          {{ props.item.productName }}
        </h2>
        <span v-if="props.item.size" class="cart-item__size"
          >Размер {{ props.item.size }}</span
        >
      </div>
      <p
        v-if="props.unavailable"
        :id="unavailableMessageId"
        class="cart-item__unavailable"
        role="status"
      >
        Сейчас недоступно — удалите позицию или выберите другую
      </p>
      <ul
        v-if="addonRows.length"
        class="cart-item__addons"
        aria-label="Добавки"
      >
        <li v-for="addon in addonRows" :key="addon.id" class="cart-item__addon">
          <span
            >+ {{ addon.name
            }}<span v-if="addon.quantity > 1" class="cart-item__addon-quantity"
              >×{{ addon.quantity }}</span
            ></span
          >
        </li>
      </ul>
    </div>
    <button
      type="button"
      class="cart-item__remove"
      :aria-label="`Удалить ${props.item.productName}`"
      :disabled="props.disabled"
      @click="emit('removeItem', props.item.id)"
    >
      <Trash2 class="cart-item__remove-icon" aria-hidden="true" />
    </button>
    <footer class="cart-item__footer">
      <p class="cart-item__price">
        <span v-if="props.priceOutdated">Цена до обновления</span>
        <strong data-testid="cart-item-line-total"
          >{{ props.item.lineTotalRub }} ₽</strong
        >
      </p>
      <div class="cart-item__quantity" aria-label="Количество">
        <ui-icon-btn
          type="button"
          class="cart-item__quantity-control"
          :aria-label="`Уменьшить количество ${props.item.productName}`"
          :disabled="
            props.disabled || props.item.quantity === 1 || props.unavailable
          "
          @click="
            emit('updateQuantity', props.item.id, props.item.quantity - 1)
          "
        >
          <Minus class="cart-item__quantity-icon" aria-hidden="true" />
        </ui-icon-btn>
        <output class="cart-item__quantity-value" aria-live="polite">{{
          props.item.quantity
        }}</output>
        <ui-icon-btn
          type="button"
          class="cart-item__quantity-control"
          :aria-label="`Увеличить количество ${props.item.productName}`"
          :disabled="props.disabled || props.unavailable"
          @click="
            emit('updateQuantity', props.item.id, props.item.quantity + 1)
          "
        >
          <Plus class="cart-item__quantity-icon" aria-hidden="true" />
        </ui-icon-btn>
      </div>
    </footer>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Minus, Plus, Trash2 } from "lucide-vue-next";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import type { CartItemEmits, CartItemProps } from "./CartItem.types";

const props = defineProps<CartItemProps>();
const emit = defineEmits<CartItemEmits>();
const unavailableMessageId = `cart-item-unavailable-${props.item.id}`;

const addonRows = computed(() => {
  const addonsById = new Map<
    string,
    { id: string; name: string; quantity: number }
  >();

  for (const addon of props.item.addons) {
    const existingAddon = addonsById.get(addon.id);

    if (existingAddon) {
      existingAddon.quantity += 1;
      continue;
    }

    addonsById.set(addon.id, { ...addon, quantity: 1 });
  }

  return [...addonsById.values()];
});
</script>

<style scoped lang="scss">
.cart-item {
  display: grid;
  grid-template-areas:
    "details remove"
    "footer footer";
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  column-gap: var(--customer-space-7);
  row-gap: var(--customer-space-7);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card);
}

.cart-item--unavailable {
  outline: 2px solid var(--customer-danger);
  outline-offset: -2px;
}

.cart-item__details {
  display: grid;
  grid-area: details;
  row-gap: var(--customer-space-4);
  min-width: 0;
}

.cart-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--customer-space-5);
}

.cart-item__unavailable {
  margin: 0;
  color: var(--customer-danger);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}

.cart-item__name {
  margin: 0;
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: 1.5rem;
  overflow-wrap: anywhere;
}

.cart-item__size {
  padding: 0.125rem var(--customer-space-5);
  color: var(--customer-color-blue-500);
  background: var(--customer-color-blue-500-10);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-2xs);
  font-weight: var(--customer-font-weight-bold);
}

.cart-item__price {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}

.cart-item__addons {
  display: grid;
  gap: var(--customer-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-wrap: anywhere;
}

.cart-item__addon {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}

.cart-item__addon-quantity {
  margin-left: var(--customer-space-3);
  white-space: nowrap;
}

.cart-item__footer {
  display: flex;
  grid-area: footer;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-7);
  min-width: 0;
}

.cart-item__price {
  display: grid;
  gap: var(--customer-space-2);
  margin: 0;
  white-space: nowrap;
}

.cart-item__price span {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}

.cart-item__price strong {
  color: var(--customer-background);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

.cart-item__quantity {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-sm);
}

.cart-item__quantity-control {
  flex: 0 0 auto;
  width: calc(var(--customer-space-12) * 2);
  min-width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  min-height: calc(var(--customer-space-12) * 2);
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
  border-radius: 0;
}

.cart-item__quantity-icon {
  width: var(--customer-size-icon-sm);
  height: var(--customer-size-icon-sm);
}

.cart-item__quantity-value {
  display: grid;
  min-width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  padding: 0 var(--customer-space-5);
  place-items: center;
  text-align: center;
  color: var(--customer-text-on-surface);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  border-right: 1px solid var(--customer-border-subtle-on-surface);
  border-left: 1px solid var(--customer-border-subtle-on-surface);
}

.cart-item__remove {
  display: inline-flex;
  grid-area: remove;
  align-items: center;
  justify-content: center;
  position: relative;
  width: calc(var(--customer-space-12) * 2);
  min-width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  min-height: calc(var(--customer-space-12) * 2);
  padding: 0;
  color: var(--customer-danger);
  background: transparent;
  border: 0;
  font: inherit;
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
  cursor: pointer;
}

.cart-item__remove::before {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--customer-size-control-sm);
  height: var(--customer-size-control-sm);
  content: "";
  background: var(--customer-danger-10);
  border-radius: var(--customer-radius-round);
}

.cart-item__remove-icon {
  position: absolute;
  top: var(--customer-space-5);
  right: var(--customer-space-5);
  width: var(--customer-size-icon-sm);
  height: var(--customer-size-icon-sm);
}

.cart-item__remove:disabled {
  cursor: not-allowed;
  opacity: var(--customer-state-disabled-opacity);
}

@media (max-width: 479px) {
  .cart-item__footer {
    flex-wrap: wrap;
  }

  .cart-item__quantity {
    margin-left: auto;
  }
}
</style>
