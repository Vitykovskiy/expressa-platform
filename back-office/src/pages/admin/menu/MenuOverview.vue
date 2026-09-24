<template>
  <div class="menu-overview">
    <div class="menu-overview__toolbar">
      <AdminActionGroup class="menu-overview__actions">
        <AdminButton
          class="menu-overview__create"
          type="button"
          :disabled="props.disabled"
          @click="emit('addCategory')"
          >Добавить группу</AdminButton
        ><AdminButton
          class="menu-overview__create"
          type="button"
          variant="secondary"
          :disabled="props.disabled"
          @click="emit('addProduct')"
          >Добавить товар</AdminButton
        >
      </AdminActionGroup>
    </div>
    <p v-if="props.reorderSaved" class="menu-overview__status">
      Порядок сохранён
    </p>
    <p class="menu-overview__summary">
      {{ categoryCountLabel(props.categories.length) }} ·
      {{ modifierGroupCountLabel(props.modifierGroups.length) }}
    </p>
    <section>
      <div class="menu-overview__section-heading">
        <h2>Основное меню</h2>
        <AdminButton
          class="menu-overview__reorder"
          type="button"
          variant="ghost"
          :disabled="props.disabled"
          @click="emit('reorder')"
          ><AdminIcon :icon="ListOrdered" />Порядок</AdminButton
        >
      </div>
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
          @show-label="fullLabel = $event"
        />
      </div>
      <p v-else class="menu-overview__empty">Категорий пока нет.</p>
    </section>
    <section>
      <h2>Группы опций</h2>
      <div v-if="props.modifierGroups.length" class="menu-overview__list">
        <MenuModifierGroupRow
          v-for="group in props.modifierGroups"
          :key="group.id"
          :group="group"
          :disabled="props.disabled"
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
    <AdminDialog
      :model-value="fullLabel !== null"
      :title="fullLabel ?? ''"
      :max-width="'var(--expressa-size-confirm-dialog-max-width)'"
      @update:model-value="fullLabel = null"
    />
  </div>
</template>
<script setup lang="ts">
import { shallowRef } from "vue";
import { ListOrdered } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
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
const fullLabel = shallowRef<string | null>(null);

function productsFor(categoryId: string) {
  return props.products
    .filter((product) => product.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
</script>
<style scoped lang="scss">
.menu-overview {
  display: grid;
  gap: var(--expressa-space-24);
}
.menu-overview__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
}
.menu-overview__create,
.menu-overview__reorder {
  display: inline-flex;
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.menu-overview__actions {
  gap: var(--expressa-space-sm);
}
.menu-overview__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
  margin-bottom: 0;
}
.menu-overview h2 {
  margin: 0 0 var(--expressa-space-md);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--expressa-color-text-secondary);
}
.menu-overview__section-heading h2 {
  margin-bottom: 0;
}
.menu-overview__section-heading .menu-overview__reorder {
  min-block-size: 32px;
  gap: var(--expressa-space-2xs);
  font-size: var(--expressa-font-size-caption);
  color: var(--expressa-color-text-secondary);
}
.menu-overview__list {
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}
.menu-overview__summary,
.menu-overview__empty {
  color: var(--expressa-color-text-secondary);
}
.menu-overview__summary {
  position: absolute;
  inset-block-start: var(--expressa-space-24);
  inset-inline-end: var(--expressa-space-24);
  margin: 0;
  font-size: var(--expressa-font-size-caption);
}
.menu-overview__status {
  color: var(--expressa-color-status-success);
}
.menu-overview__empty {
  margin: 0;
  padding: var(--expressa-space-md);
}
@media (max-width: 767px) {
  .menu-overview__toolbar {
    align-items: stretch;
    flex-wrap: wrap;
    gap: var(--expressa-space-sm);
  }
  .menu-overview__actions {
    width: 100%;
    flex-wrap: nowrap;
  }
  .menu-overview__create {
    flex: 1;
    min-width: 0;
    padding-inline: var(--expressa-space-control-inline);
  }
  .menu-overview__create:first-child {
    flex-grow: 1.25;
  }
  .menu-overview__reorder {
    margin-inline-start: auto;
  }
  .menu-overview__summary {
    display: none;
  }
}
</style>
