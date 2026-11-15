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
      </div>
      <p v-if="optionSummary" class="cart-item__options">{{ optionSummary }}</p>
      <p
        v-if="props.unavailable"
        :id="unavailableMessageId"
        class="cart-item__unavailable"
        role="status"
      >
        Сейчас недоступно
      </p>
    </div>
    <div class="cart-item__actions">
      <UiIconBtn
        v-if="!props.unavailable"
        class="cart-item__edit"
        :aria-label="`Настроить напиток ${props.item.productName}`"
        :disabled="props.disabled"
        @click="emit('editItem', props.item.id)"
      >
        <Pencil :size="20" aria-hidden="true" />
      </UiIconBtn>
      <UiIconBtn
        class="cart-item__remove"
        :aria-label="`Удалить ${props.item.productName}`"
        :disabled="props.disabled"
        @click="emit('removeItem', props.item.id)"
      >
        <Trash2 :size="20" aria-hidden="true" />
      </UiIconBtn>
    </div>
    <footer class="cart-item__footer">
      <p class="cart-item__price">
        <span v-if="props.priceOutdated">Цена до обновления</span>
        <strong data-testid="cart-item-line-total">{{
          formatRubAmount(props.item.lineTotalRub)
        }}</strong>
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
import { Minus, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { formatRubles } from "@/entities/customer/model/money";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import type { CartItemEmits, CartItemProps } from "./CartItem.types";

const props = defineProps<CartItemProps>();
const emit = defineEmits<CartItemEmits>();
const unavailableMessageId = `cart-item-unavailable-${props.item.id}`;
const portionLabel = computed(() =>
  "portionLabel" in props.item ? props.item.portionLabel : undefined,
);

function formatRubAmount(value: number): string {
  return formatRubles(value);
}

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
const optionSummary = computed(() => {
  const labels = addonRows.value.map((addon) => {
    const name =
      addon.name.charAt(0).toLocaleUpperCase("ru-RU") + addon.name.slice(1);

    return addon.quantity > 1 ? `${name} ×${addon.quantity}` : name;
  });

  if (portionLabel.value) {
    labels.unshift(portionLabel.value);
  }

  return labels.join(" · ");
});
</script>

<style scoped>
.cart-item {
  display: grid;
  grid-template-areas: "details actions" "footer footer";
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--customer-space-5);
  padding: var(--customer-space-9) 0;
  color: var(--customer-text-on-surface);
  border-bottom: 1px solid var(--customer-border-subtle-on-surface);
}
.cart-item:last-child {
  border-bottom: 0;
}
.cart-item__details {
  display: grid;
  grid-area: details;
  gap: var(--customer-space-1);
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
  overflow-wrap: anywhere;
}
.cart-item__options {
  margin: 0;
  color: var(--customer-color-text-secondary-on-surface);
  font-size: var(--customer-font-size-sm);
  overflow-wrap: anywhere;
}
.cart-item__unavailable {
  margin: 0;
  color: var(--customer-danger);
  font-size: var(--customer-font-size-sm);
}
.cart-item__actions {
  display: flex;
  grid-area: actions;
  align-items: center;
}
.cart-item__edit,
.cart-item__remove {
  flex: 0 0 calc(var(--customer-space-12) * 2);
  width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
  border-radius: var(--customer-radius-sm);
}
.cart-item__remove {
  color: var(--customer-danger);
}
.cart-item__edit:hover:not(:disabled),
.cart-item__remove:hover:not(:disabled) {
  background: var(--customer-surface-info);
}
.cart-item__footer {
  display: flex;
  grid-area: footer;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-5);
  min-width: 0;
}
.cart-item__price {
  display: grid;
  gap: var(--customer-space-1);
  margin: 0;
  white-space: nowrap;
}
.cart-item__price span {
  color: var(--customer-color-text-secondary-on-surface);
  font-size: var(--customer-font-size-xs);
}
.cart-item__price strong {
  font-size: var(--customer-font-size-2xl);
  font-weight: var(--customer-font-weight-extrabold);
}
.cart-item__quantity {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-sm);
}
.cart-item__quantity-control {
  flex: 0 0 auto;
  width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
  border-radius: var(--customer-radius-sm);
}
.cart-item__quantity-control:hover:not(:disabled) {
  background: var(--customer-surface-info);
}
.cart-item__quantity-icon {
  width: var(--customer-size-icon-sm);
  height: var(--customer-size-icon-sm);
}
.cart-item__quantity-value {
  display: grid;
  min-width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  place-items: center;
  color: var(--customer-text-on-surface);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
}
@media (min-width: 768px) {
  .cart-item {
    grid-template-areas: "details footer actions";
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--customer-space-9);
    padding-block: var(--customer-space-13);
  }
  .cart-item__footer {
    gap: var(--customer-space-13);
  }
}
</style>
