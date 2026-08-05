<template>
  <section class="menu-category">
    <header class="menu-category__header">
      <AdminButton
        class="menu-category__toggle"
        type="button"
        variant="ghost"
        :aria-expanded="props.expanded"
        @click="emit('toggle', props.category)"
      >
        <span aria-hidden="true">
          {{ props.expanded ? "⌄" : "›" }}
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
      <AdminButton
        :disabled="props.disabled || !props.canMoveUp"
        :aria-label="`Переместить категорию ${props.category.name} вверх`"
        class="menu-category__move"
        type="button"
        variant="ghost"
        @click="emit('moveUp', props.category)"
        >↑</AdminButton
      >
      <AdminButton
        :disabled="props.disabled || !props.canMoveDown"
        :aria-label="`Переместить категорию ${props.category.name} вниз`"
        class="menu-category__move"
        type="button"
        variant="ghost"
        @click="emit('moveDown', props.category)"
        >↓</AdminButton
      >
      <AdminButton
        :disabled="props.disabled"
        class="menu-category__edit"
        type="button"
        variant="ghost"
        :aria-label="`Редактировать категорию ${props.category.name}`"
        @click="emit('edit-category', props.category)"
      >
        Редактировать
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
        @edit="emit('edit', $event)"
        @move-up="emit('moveProductUp', $event)"
        @move-down="emit('moveProductDown', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import MenuProductRow from "./MenuProductRow.vue";
import type {
  MenuCategoryGroupEmits,
  MenuCategoryGroupProps,
} from "./MenuCategoryGroup.types";

const props = defineProps<MenuCategoryGroupProps>();
const emit = defineEmits<MenuCategoryGroupEmits>();

const countLabel = computed(() => {
  const itemType = props.products.length === 1 ? "товар" : "товаров";

  return `${props.products.length} ${itemType}`;
});
</script>

<style scoped lang="scss">
.menu-category {
  overflow: hidden;
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.menu-category__header {
  display: flex;
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

.menu-category__move {
  width: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}

.menu-category__toggle {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-control-inline) var(--expressa-space-md);
  text-align: left;
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
  padding: var(--expressa-space-control-inline) var(--expressa-space-md);
  color: var(--expressa-color-accent);
  font: inherit;
  font-size: var(--expressa-font-size-action);
}

.menu-category__empty {
  padding: var(--expressa-space-xl) var(--expressa-space-md);
  text-align: center;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

@media (max-width: 767px) {
  .menu-category__header {
    flex-wrap: wrap;
  }

  .menu-category__toggle {
    flex-basis: calc(100% - 88px);
  }

  .menu-category__edit {
    width: 100%;
  }
}
</style>
