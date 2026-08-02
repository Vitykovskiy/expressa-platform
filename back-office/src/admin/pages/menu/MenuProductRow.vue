<template>
  <AdminButton
    class="menu-product-row"
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
    <span aria-hidden="true">›</span>
  </AdminButton>
</template>

<script setup lang="ts">
import type { MenuItem } from "../../shared/ui/Admin.types";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import type {
  MenuProductRowEmits,
  MenuProductRowProps,
} from "./MenuProductRow.types";

const props = defineProps<MenuProductRowProps>();
const emit = defineEmits<MenuProductRowEmits>();

function priceLabel(product: MenuItem) {
  if (product.sizes?.length) {
    return product.sizes
      .map((size) => `${size.size}: ${size.price} ₽`)
      .join(" · ");
  }

  if (product.price === undefined) {
    return "Нет цены";
  }

  return product.isOptionGroup && product.price === 0
    ? "Бесплатно"
    : `${product.price} ₽`;
}
</script>

<style scoped lang="scss">
.menu-product-row {
  display: flex;
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-control-inline) var(--expressa-space-md)
    var(--expressa-space-control-inline) var(--expressa-space-product-indent);
  color: var(--expressa-color-text-primary);
  text-align: left;
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-none);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  cursor: pointer;
}

.menu-product-row:hover {
  background: var(--expressa-color-control-hover-surface);
}

.menu-product-row__content {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-2xs);
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
