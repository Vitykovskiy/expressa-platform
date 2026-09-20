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
      <ChevronRight
        v-if="!props.showManagementActions"
        aria-hidden="true"
        class="menu-product-row__chevron"
        :size="18"
      />
      <span v-else class="menu-product-row__edit-label">Изменить</span>
    </AdminButton>
    <div v-if="props.showManagementActions" class="menu-product-row__order">
      <span class="menu-product-row__order-label">Порядок</span>
      <AdminButton
        :disabled="props.disabled || !props.canMoveUp"
        :aria-label="`Переместить товар ${props.product.name} вверх`"
        class="menu-product-row__move"
        type="button"
        variant="ghost"
        @click="emit('moveUp', props.product)"
      >
        <ArrowUp :size="18" aria-hidden="true" />
        <span>Выше</span>
      </AdminButton>
      <AdminButton
        :disabled="props.disabled || !props.canMoveDown"
        :aria-label="`Переместить товар ${props.product.name} вниз`"
        class="menu-product-row__move"
        type="button"
        variant="ghost"
        @click="emit('moveDown', props.product)"
      >
        <ArrowDown :size="18" aria-hidden="true" />
        <span>Ниже</span>
      </AdminButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import type { Product } from "./catalog.types";
import type {
  MenuProductRowEmits,
  MenuProductRowProps,
} from "./MenuProductRow.types";

const props = defineProps<MenuProductRowProps>();
const emit = defineEmits<MenuProductRowEmits>();

function priceLabel(product: Product): string {
  if (product.priceChoices && product.priceChoices.length > 0) {
    return product.priceChoices
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((choice) => `${choice.portionLabel}: ${formatPrice(choice.price)}`)
      .join(" · ");
  }

  if (product.type === "DRINK") {
    return product.variants
      .map((variant) => `${variant.size}: ${formatPrice(variant.price)}`)
      .join(" · ");
  }

  return product.price === null ? "Нет цены" : formatPrice(product.price);
}

function formatPrice(price: number): string {
  return `${price} ₽`;
}
</script>

<style scoped lang="scss">
.menu-product-row {
  display: flex;
  width: 100%;
  min-height: 63px;
  align-items: center;
  flex-wrap: wrap;
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
  display: inline-flex;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  gap: var(--expressa-space-2xs);
  padding-inline: var(--expressa-space-sm);
}

.menu-product-row__order {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--expressa-space-2xs);
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

.menu-product-row__order-label {
  color: var(--expressa-color-text-secondary);
}

.menu-product-row__edit-label {
  align-self: center;
  color: var(--expressa-color-accent);
}

@media (max-width: 767px) {
  .menu-product-row__edit {
    width: 100%;
  }

  .menu-product-row__order {
    margin-inline-start: var(--expressa-space-md);
  }
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
