<template>
  <li
    class="cart-item"
    :aria-label="`Позиция корзины: ${props.item.productName}`"
  >
    <div class="cart-item__details">
      <div class="cart-item__title">
        <h2 class="cart-item__name">
          {{ props.item.productName }}
        </h2>
        <span v-if="props.item.size" class="cart-item__size">{{
          props.item.size
        }}</span>
      </div>
      <p v-if="props.item.addons.length" class="cart-item__addons">
        + {{ props.item.addons.map((addon) => addon.name).join(", ") }}
      </p>
      <p class="cart-item__price">
        x{{ props.item.quantity }}
        <strong>{{ props.item.lineTotalRub }} ₽</strong>
      </p>
    </div>
    <ui-icon-btn
      type="button"
      class="cart-item__remove"
      :aria-label="`Удалить ${props.item.productName}`"
      @click="emit('removeItem', props.item.id)"
    >
      <X class="cart-item__remove-icon" aria-hidden="true" />
    </ui-icon-btn>
  </li>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import UiIconBtn from "../../shared/ui/icon-btn/UiIconBtn.vue";
import type { CartItemEmits, CartItemProps } from "./CartItem.types";

const props = defineProps<CartItemProps>();
const emit = defineEmits<CartItemEmits>();
</script>

<style scoped lang="scss">
.cart-item {
  display: flex;
  align-items: flex-start;
  gap: var(--customer-space-7);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card);
}

.cart-item__details {
  flex: 1;
  min-width: 0;
}

.cart-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--customer-space-5);
}

.cart-item__name {
  margin: 0;
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: var(--customer-line-height-label);
}

.cart-item__size {
  padding: var(--customer-space-1) var(--customer-space-5);
  color: var(--customer-background);
  background: var(--customer-color-info-surface);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-2xs);
  font-weight: var(--customer-font-weight-bold);
}

.cart-item__addons,
.cart-item__price {
  margin-bottom: 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}

.cart-item__addons {
  margin-top: var(--customer-space-4);
}

.cart-item__price {
  display: flex;
  align-items: center;
  gap: var(--customer-space-7);
  margin-top: var(--customer-space-5);
}

.cart-item__price strong {
  color: var(--customer-background);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

.cart-item__remove {
  flex: 0 0 auto;
  min-width: calc(var(--customer-space-12) * 2);
  min-height: calc(var(--customer-space-12) * 2);
  width: var(--customer-size-control-sm);
  height: var(--customer-size-control-sm);
  color: var(--customer-danger);
  background: var(--customer-danger-10);
  border: 0;
}

.cart-item__remove-icon {
  width: var(--customer-spacing-xl);
  height: var(--customer-spacing-xl);
}
</style>
