<template>
  <div class="menu-overview">
    <section>
      <div class="menu-overview__section-heading">
        <h2 class="menu-overview__title">Категории и товары</h2>
        <AdminActionGroup align="start" class="menu-overview__actions">
          <AdminButton :disabled="props.disabled" @click="emit('addCategory')">
            <AdminIcon :icon="Plus" /><span>Добавить категорию</span>
          </AdminButton>
          <AdminButton
            v-if="props.categories.length"
            variant="secondary"
            :disabled="props.disabled"
            @click="emit('addProduct')"
          >
            <AdminIcon :icon="Plus" /><span>Добавить товар</span>
          </AdminButton>
          <AdminButton
            v-if="canReorder"
            variant="ghost"
            :disabled="props.disabled"
            @click="emit('reorder')"
          >
            <AdminIcon :icon="ListOrdered" /><span>Изменить порядок</span>
          </AdminButton>
        </AdminActionGroup>
      </div>
      <div v-if="props.categories.length" class="menu-overview__list">
        <MenuCategoryGroup
          v-for="category in props.categories"
          :key="category.id"
          :category="category"
          :products="productsByCategory.get(category.id) ?? []"
          :expanded="props.expandedCategoryIds.has(category.id)"
          :disabled="props.disabled"
          @toggle="emit('toggleCategory', $event)"
          @edit-category="emit('editCategory', $event)"
          @edit="emit('editProduct', $event)"
        />
      </div>
      <p v-else class="menu-overview__empty">Категорий пока нет</p>
    </section>
    <section>
      <div class="menu-overview__section-heading">
        <h2 class="menu-overview__title">Группы добавок</h2>
        <AdminButton
          variant="secondary"
          :disabled="props.disabled"
          @click="emit('addModifierGroup')"
        >
          <AdminIcon :icon="Plus" /><span>Добавить группу</span>
        </AdminButton>
      </div>
      <div v-if="props.modifierGroups.length" class="menu-overview__list">
        <MenuModifierGroupRow
          v-for="group in props.modifierGroups"
          :key="group.id"
          :group="group"
          :disabled="props.disabled"
          @edit="emit('editModifierGroup', $event)"
        />
      </div>
      <p v-else class="menu-overview__empty">Групп добавок пока нет</p>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ListOrdered, Plus } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import MenuCategoryGroup from "./MenuCategoryGroup.vue";
import MenuModifierGroupRow from "./MenuModifierGroupRow.vue";
import type { Product } from "./catalog.types";
import type {
  MenuOverviewEmits,
  MenuOverviewProps,
} from "./MenuOverview.types";
const props = withDefaults(defineProps<MenuOverviewProps>(), {
  disabled: false,
});
const emit = defineEmits<MenuOverviewEmits>();
const productsByCategory = computed(() => {
  const groups = new Map<string, Product[]>();
  for (const product of [...props.products].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )) {
    const products = groups.get(product.categoryId) ?? [];
    products.push(product);
    groups.set(product.categoryId, products);
  }
  return groups;
});
const canReorder = computed(
  () =>
    props.categories.length > 1 ||
    props.categories.some(
      (category) =>
        (productsByCategory.value.get(category.id)?.length ?? 0) > 1,
    ),
);
</script>
<style scoped>
.menu-overview {
  display: grid;
  gap: var(--expressa-space-32);
  container-type: inline-size;
}
.menu-overview__section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-16);
  margin-bottom: var(--expressa-space-16);
}
.menu-overview__title {
  margin: 0;
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  color: var(--expressa-color-text-primary);
}
.menu-overview__list {
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}
.menu-overview__empty {
  margin: 0;
  padding: var(--expressa-space-24);
  border: var(--expressa-border-width-default) dashed
    var(--expressa-color-border-strong);
  border-radius: var(--expressa-radius-panel);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface);
}
.menu-overview__actions {
  gap: var(--expressa-space-sm);
}
@container (max-width: 640px) {
  .menu-overview__section-heading:has(.menu-overview__actions) {
    align-items: start;
    flex-direction: column;
  }
  .menu-overview__actions {
    width: 100%;
  }
}
</style>
