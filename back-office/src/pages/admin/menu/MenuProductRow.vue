<template>
  <div class="menu-product-row">
    <AdminButton
      :id="`menu-product-${props.product.id}`"
      class="menu-product-row__label"
      type="button"
      variant="ghost"
      :disabled="props.disabled"
      @click="openProductLabel"
    >
      <span class="menu-product-row__content">
        <span ref="labelText" class="menu-product-row__name">
          {{ props.product.name }}
        </span>
        <span class="menu-product-row__price">
          {{ priceLabel(props.product) }}
        </span>
      </span>
    </AdminButton>
    <AdminButton
      class="menu-product-row__edit"
      type="button"
      variant="ghost"
      :disabled="props.disabled"
      @click="emit('edit', props.product)"
    >
      <AdminIcon v-if="!props.showManagementActions" :icon="ChevronRight" />
      <span v-else class="menu-product-row__edit-label">Изменить</span>
    </AdminButton>
    <div v-if="props.showManagementActions" class="menu-product-row__order">
      <span class="menu-product-row__order-label">Порядок</span>
      <AdminButton
        :disabled="props.disabled || !props.canMoveUp"
        :data-menu-product-order-action="`${props.product.id}:up`"
        class="menu-product-row__move"
        type="button"
        variant="ghost"
        @click="emit('moveUp', props.product)"
      >
        <AdminIcon :icon="ArrowUp" />
        <span>Выше</span>
      </AdminButton>
      <AdminButton
        :disabled="props.disabled || !props.canMoveDown"
        :data-menu-product-order-action="`${props.product.id}:down`"
        class="menu-product-row__move"
        type="button"
        variant="ghost"
        @click="emit('moveDown', props.product)"
      >
        <AdminIcon :icon="ArrowDown" />
        <span>Ниже</span>
      </AdminButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import type { Product } from "./catalog.types";
import type {
  MenuProductRowEmits,
  MenuProductRowProps,
} from "./MenuProductRow.types";

const props = defineProps<MenuProductRowProps>();
const emit = defineEmits<MenuProductRowEmits>();
const labelText = shallowRef<HTMLElement | null>(null);
const isTruncated = shallowRef(false);
let labelObserver: ResizeObserver | null = null;

function updateTruncation(): void {
  const text = labelText.value;
  isTruncated.value = text !== null && text.scrollWidth > text.clientWidth + 1;
}

function openProductLabel(): void {
  if (isTruncated.value) emit("showLabel", props.product.name);
  else emit("edit", props.product);
}

onMounted(() => {
  if (labelText.value !== null) {
    labelObserver = new ResizeObserver(updateTruncation);
    labelObserver.observe(labelText.value);
  }
  updateTruncation();
});
onBeforeUnmount(() => labelObserver?.disconnect());
watch(
  () => props.product.name,
  () => void nextTick(updateTruncation),
);

function priceLabel(product: Product): string {
  if (product.priceChoices && product.priceChoices.length > 0) {
    return product.priceChoices
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((choice) => `${choice.portionLabel}: ${formatPrice(choice.price)}`)
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
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  flex-wrap: wrap;
  color: var(--expressa-color-text-primary);
  text-align: left;
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-product-row__label:hover,
.menu-product-row__edit:hover {
  background: var(--expressa-color-control-hover-surface);
}

.menu-product-row__label {
  display: flex;
  min-width: 0;
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  flex: 1;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-sm) var(--expressa-space-md)
    var(--expressa-space-sm) var(--expressa-space-48);
  text-align: left;
}
.menu-product-row__edit {
  display: inline-flex;
  min-inline-size: var(--expressa-size-control-min-height);
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  margin-inline-end: var(--expressa-space-sm);
  color: var(--expressa-color-text-muted);
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
