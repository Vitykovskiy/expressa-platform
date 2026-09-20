<template>
  <section class="menu-category">
    <header class="menu-category__header">
      <AdminButton
        class="menu-category__toggle"
        type="button"
        variant="ghost"
        :disabled="props.disabled"
        :aria-expanded="props.expanded"
        :aria-label="`Открыть категорию ${props.category.name}`"
        @click="emit('toggle', props.category)"
      >
        <span aria-hidden="true" class="menu-category__toggle-icon">
          <ChevronDown
            v-if="props.expanded"
            aria-hidden="true"
            class="menu-category__icon"
            :size="18"
          />
          <ChevronRight
            v-else
            aria-hidden="true"
            class="menu-category__icon"
            :size="18"
          />
        </span>
        <span class="menu-category__copy">
          <span class="menu-category__name">
            {{ props.category.name }}
          </span>
          <span class="menu-category__count">
            {{ countLabel }}
          </span>
        </span>
      </AdminButton>
      <div v-if="props.showManagementActions" class="menu-category__order">
        <span class="menu-category__order-label">Порядок</span>
        <AdminButton
          :disabled="props.disabled || !props.canMoveUp"
          :aria-label="`Переместить категорию ${props.category.name} вверх`"
          class="menu-category__move"
          type="button"
          variant="ghost"
          @click="emit('moveUp', props.category)"
        >
          <ArrowUp aria-hidden="true" class="menu-category__icon" :size="18" />
          <span>Выше</span>
        </AdminButton>
        <AdminButton
          :disabled="props.disabled || !props.canMoveDown"
          :aria-label="`Переместить категорию ${props.category.name} вниз`"
          class="menu-category__move"
          type="button"
          variant="ghost"
          @click="emit('moveDown', props.category)"
        >
          <ArrowDown
            aria-hidden="true"
            class="menu-category__icon"
            :size="18"
          />
          <span>Ниже</span>
        </AdminButton>
      </div>
      <AdminButton
        :disabled="props.disabled"
        class="menu-category__edit"
        type="button"
        variant="ghost"
        :aria-label="`Редактировать категорию ${props.category.name}`"
        @click="emit('edit-category', props.category)"
      >
        <template v-if="props.showManagementActions">
          Изменить группу
        </template>
        <template v-else>
          <Pencil aria-hidden="true" class="menu-category__icon" :size="18" />
          <span class="menu-category__edit-label">Редактировать</span>
        </template>
      </AdminButton>
    </header>

    <div v-if="props.expanded">
      <p v-if="props.products.length === 0" class="menu-category__empty">
        Товаров в этой категории пока нет
      </p>
      <MenuProductRow
        v-for="(product, index) in props.products"
        v-else
        :key="product.id"
        :product="product"
        :can-move-up="index > 0"
        :can-move-down="index < props.products.length - 1"
        :disabled="props.disabled"
        :show-management-actions="props.showManagementActions"
        @edit="emit('edit', $event)"
        @move-up="emit('moveProductUp', $event)"
        @move-down="emit('moveProductDown', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import MenuProductRow from "./MenuProductRow.vue";
import type {
  MenuCategoryGroupEmits,
  MenuCategoryGroupProps,
} from "./MenuCategoryGroup.types";

const props = defineProps<MenuCategoryGroupProps>();
const emit = defineEmits<MenuCategoryGroupEmits>();

const countLabel = computed(() => {
  const count = props.products.length;
  const finalTwoDigits = count % 100;
  const finalDigit = count % 10;
  const itemType =
    finalTwoDigits >= 11 && finalTwoDigits <= 14
      ? "товаров"
      : finalDigit === 1
        ? "товар"
        : finalDigit >= 2 && finalDigit <= 4
          ? "товара"
          : "товаров";

  return `${count} ${itemType}`;
});
</script>

<style scoped lang="scss">
.menu-category {
  overflow: hidden;
  background: var(--expressa-color-surface);
}

.menu-category:not(:last-child) {
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-category__header {
  display: flex;
  min-height: 70px;
  align-items: center;
  flex-wrap: wrap;
  background: var(--expressa-color-surface-raised);
}

.menu-category__toggle,
.menu-category__edit,
.menu-category__move {
  min-height: var(--expressa-size-control-min-height);
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  cursor: pointer;
}

.menu-category__order {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--expressa-space-2xs);
}

.menu-category__move,
.menu-category__edit {
  min-height: var(--expressa-size-control-min-height);
}

.menu-category__move {
  display: inline-flex;
  align-items: center;
  gap: var(--expressa-space-2xs);
  padding-inline: var(--expressa-space-sm);
}

.menu-category__toggle {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-control-inline);
  padding: 14px var(--expressa-space-md) 14px 20px;
  text-align: left;
}

.menu-category__toggle-icon {
  display: grid;
  flex: 0 0 18px;
  place-items: center;
}

.menu-category__copy {
  display: grid;
  min-width: 0;
}

.menu-category__name {
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-category__count,
.menu-category__empty {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}

.menu-category__edit {
  display: inline-flex;
  align-items: center;
  gap: var(--expressa-space-2xs);
  padding-inline: var(--expressa-space-sm);
  color: var(--expressa-color-accent);
  font: inherit;
}

.menu-category__icon {
  display: block;
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.menu-category__toggle:hover,
.menu-category__edit:hover,
.menu-category__move:hover:not(:disabled) {
  background: var(--expressa-color-control-hover-surface);
}

.menu-category__empty {
  padding: var(--expressa-space-xl) var(--expressa-space-md);
  text-align: center;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

@media (max-width: 767px) {
  .menu-category__toggle {
    width: 100%;
  }

  .menu-category__edit,
  .menu-category__order {
    margin-inline-start: var(--expressa-space-md);
  }
}

.menu-category__order-label {
  color: var(--expressa-color-text-secondary);
}

.menu-category__edit-label {
  position: absolute;
  width: var(--expressa-size-visually-hidden);
  height: var(--expressa-size-visually-hidden);
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
