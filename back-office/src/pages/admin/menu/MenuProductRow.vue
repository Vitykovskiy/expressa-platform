<template>
  <div class="menu-product-row">
    <AdminButton
      :aria-label="`Редактировать товар ${props.product.name}`"
      class="menu-product-row__edit"
      type="button"
      variant="ghost"
      @click="emit('edit', props.product)"
    >
      <span class="menu-product-row__content">
        <span class="menu-product-row__name">
          {{ props.product.name }}
        </span>
        <span class="menu-product-row__price">
          {{ priceLabel(props.product) }}
        </span>
      </span>
      <svg
        aria-hidden="true"
        class="menu-product-row__chevron"
        fill="none"
        height="18"
        viewBox="0 0 18 18"
        width="18"
      >
        <path
          d="m7 4.5 4.5 4.5L7 13.5"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
      </svg>
    </AdminButton>
    <AdminButton
      v-if="props.showManagementActions"
      :disabled="props.disabled || !props.canMoveUp"
      :aria-label="`Переместить товар ${props.product.name} вверх`"
      class="menu-product-row__move"
      type="button"
      variant="ghost"
      @click="emit('moveUp', props.product)"
      >↑</AdminButton
    >
    <AdminButton
      v-if="props.showManagementActions"
      :disabled="props.disabled || !props.canMoveDown"
      :aria-label="`Переместить товар ${props.product.name} вниз`"
      class="menu-product-row__move"
      type="button"
      variant="ghost"
      @click="emit('moveDown', props.product)"
      >↓</AdminButton
    >
  </div>
</template>

<script setup lang="ts">
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import type { Product } from "./catalog.types";
import type {
  MenuProductRowEmits,
  MenuProductRowProps,
} from "./MenuProductRow.types";

const props = defineProps<MenuProductRowProps>();
const emit = defineEmits<MenuProductRowEmits>();

function priceLabel(product: Product): string {
  if (product.type === "DRINK") {
    return product.variants
      .map(
        (variant) => `${variant.size}: ${formatPriceMinor(variant.priceMinor)}`,
      )
      .join(" · ");
  }

  return product.priceMinor === null
    ? "Нет цены"
    : formatPriceMinor(product.priceMinor);
}

function formatPriceMinor(priceMinor: number): string {
  return `${priceMinor / 100} ₽`;
}
</script>

<style scoped lang="scss">
.menu-product-row {
  display: flex;
  width: 100%;
  min-height: 63px;
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  text-align: left;
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-product-row__edit:hover {
  background: var(--expressa-color-control-hover-surface);
}

.menu-product-row__edit {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-sm);
  padding: 14px var(--expressa-space-md) 14px
    var(--expressa-space-product-indent);
  text-align: left;
}

.menu-product-row__move {
  width: 44px;
  min-width: 44px;
  min-height: 63px;
  padding: 0;
  border-left: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-product-row__content {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-2xs);
}

.menu-product-row__chevron {
  flex: 0 0 18px;
  align-self: center;
}

.menu-product-row__name,
.menu-product-row__price {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-product-row__name {
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
}

.menu-product-row__price {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
</style>
