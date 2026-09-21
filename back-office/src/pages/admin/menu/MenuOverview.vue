<template>
  <div class="menu-overview">
    <div class="menu-overview__toolbar">
      <div class="menu-overview__actions">
        <AdminButton
          ref="addCategoryAction"
          type="button"
          :disabled="props.disabled"
          @click="emit('addCategory')"
          >Добавить категорию</AdminButton
        ><AdminButton
          type="button"
          variant="secondary"
          :disabled="props.disabled"
          @click="emit('addProduct')"
          >Добавить товар</AdminButton
        >
      </div>
      <AdminButton
        ref="reorderAction"
        type="button"
        variant="secondary"
        :disabled="props.disabled"
        @click="emit('reorder')"
        >Настроить порядок</AdminButton
      >
    </div>
    <p v-if="props.reorderSaved" class="menu-overview__status" role="status">
      Порядок сохранён
    </p>
    <p class="menu-overview__summary">
      {{ categoryCountLabel(props.categories.length) }} ·
      {{ modifierGroupCountLabel(props.modifierGroups.length) }}
    </p>
    <section>
      <h2>Категории меню</h2>
      <div v-if="props.categories.length" class="menu-overview__list">
        <MenuCategoryGroup
          v-for="category in props.categories"
          :key="category.id"
          :category="category"
          :products="productsFor(category.id)"
          :expanded="props.expandedCategoryIds.has(category.id)"
          :highlighted="props.highlightedCategoryId === category.id"
          :disabled="props.disabled"
          @toggle="emit('toggleCategory', $event)"
          @edit-category="emit('editCategory', $event)"
          @edit="emit('editProduct', $event)"
        />
      </div>
      <div v-else class="menu-overview__empty">
        <p>Категорий пока нет.</p>
        <AdminButton
          type="button"
          :disabled="props.disabled"
          @click="emit('addCategory')"
          >Добавить категорию</AdminButton
        >
      </div>
    </section>
    <section>
      <h2>Группы добавок</h2>
      <div v-if="props.modifierGroups.length" class="menu-overview__list">
        <MenuModifierGroupRow
          v-for="group in props.modifierGroups"
          :key="group.id"
          :group="group"
          @edit="emit('editModifierGroup', $event)"
        />
      </div>
      <div v-else class="menu-overview__empty">
        <p>Групп добавок пока нет.</p>
        <AdminButton
          type="button"
          variant="secondary"
          :disabled="props.disabled"
          @click="emit('addModifierGroup')"
          >Добавить группу добавок</AdminButton
        >
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useTemplateRef } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import MenuCategoryGroup from "./MenuCategoryGroup.vue";
import MenuModifierGroupRow from "./MenuModifierGroupRow.vue";
import {
  categoryCountLabel,
  modifierGroupCountLabel,
} from "./catalog-formatters";
import type {
  MenuOverviewEmits,
  MenuOverviewProps,
} from "./MenuOverview.types";
const props = withDefaults(defineProps<MenuOverviewProps>(), {
  disabled: false,
});
const emit = defineEmits<MenuOverviewEmits>();
const reorderAction =
  useTemplateRef<InstanceType<typeof AdminButton>>("reorderAction");
const addCategoryAction =
  useTemplateRef<InstanceType<typeof AdminButton>>("addCategoryAction");

function focusReorderAction(): void {
  reorderAction.value?.focus();
}

function focusAddCategoryAction(): void {
  addCategoryAction.value?.focus();
}

defineExpose({ focusAddCategoryAction, focusReorderAction });

function productsFor(categoryId: string) {
  return props.products
    .filter((product) => product.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
</script>
<style scoped lang="scss">
.menu-overview__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.menu-overview__actions {
  display: flex;
  gap: 8px;
}
.menu-overview h2 {
  font-size: 16px;
  text-transform: none;
  color: var(--expressa-color-text-secondary);
}
.menu-overview__list {
  border: 1px solid var(--expressa-color-border);
  border-radius: 12px;
  overflow: visible;
}
.menu-overview__summary,
.menu-overview__empty {
  color: var(--expressa-color-text-secondary);
}
.menu-overview__status {
  color: var(--expressa-color-status-success);
}
.menu-overview__empty {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--expressa-color-border);
  border-radius: 12px;
}
@media (max-width: 767px) {
  .menu-overview__toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .menu-overview__actions > * {
    flex: 1;
  }
}
</style>
