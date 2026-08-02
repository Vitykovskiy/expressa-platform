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
            {{ props.category }}
          </span>
          <span class="menu-category__count">
            {{ countLabel }}
          </span>
        </span>
      </AdminButton>
      <AdminButton
        class="menu-category__edit"
        type="button"
        variant="ghost"
        :aria-label="`Редактировать группу ${props.category}`"
        @click="emit('edit-category', props.category)"
      >
        Редактировать
      </AdminButton>
    </header>

    <div v-if="props.expanded">
      <p v-if="props.items.length === 0" class="menu-category__empty">
        {{
          isOptionGroup
            ? "Опций в этой группе пока нет"
            : "Товаров в этой группе пока нет"
        }}
      </p>
      <MenuProductRow
        v-for="item in props.items"
        v-else
        :key="item.id"
        :product="item"
        @edit="emit('edit', $event)"
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

const isOptionGroup = computed(() =>
  props.items.some((item) => item.isOptionGroup),
);

const countLabel = computed(() => {
  const itemType = isOptionGroup.value
    ? props.items.length === 1
      ? "опция"
      : "опций"
    : props.items.length === 1
      ? "товар"
      : "товаров";

  return `${props.items.length} ${itemType}`;
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
.menu-category__edit {
  min-height: var(--expressa-size-control-min-height);
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  cursor: pointer;
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
</style>
