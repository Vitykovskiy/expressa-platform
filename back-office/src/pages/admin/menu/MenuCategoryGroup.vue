<template>
  <section class="menu-category">
    <header class="menu-category__header">
      <AdminButton
        :id="`category-toggle-${props.category.id}`"
        class="menu-category__toggle"
        presentation="row"
        variant="ghost"
        :disabled="props.disabled"
        @click="emit('toggle', props.category)"
      >
        <AdminIcon :icon="props.expanded ? ChevronDown : ChevronRight" />
        <span class="menu-category__copy">
          <span class="menu-category__name">{{ props.category.name }}</span>
          <span class="menu-category__count"
            >{{ countLabel
            }}<template v-if="!props.category.isActive">
              · Скрыта</template
            ></span
          >
        </span>
      </AdminButton>
      <AdminButton
        presentation="row"
        variant="ghost"
        :disabled="props.disabled"
        @click="emit('edit-category', props.category)"
        ><AdminIcon :icon="Pencil"
      /></AdminButton>
    </header>
    <div v-if="props.expanded">
      <p v-if="!props.products.length" class="menu-category__empty">
        Товаров в этой категории пока нет
      </p>
      <template v-else>
        <MenuProductRow
          v-for="product in props.products"
          :key="product.id"
          :product="product"
          :can-move-up="false"
          :can-move-down="false"
          :disabled="props.disabled"
          @edit="emit('edit', $event)"
        />
      </template>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, ChevronRight, Pencil } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import MenuProductRow from "./MenuProductRow.vue";
import { productCountLabel } from "./catalog-formatters";
import type {
  MenuCategoryGroupEmits,
  MenuCategoryGroupProps,
} from "./MenuCategoryGroup.types";
const props = defineProps<MenuCategoryGroupProps>();
const emit = defineEmits<MenuCategoryGroupEmits>();
const countLabel = computed(() => productCountLabel(props.products.length));
</script>
<style scoped lang="scss">
.menu-category {
  background: var(--expressa-color-surface);
}
.menu-category + .menu-category {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-category__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  background: var(--expressa-color-surface-raised);
}
.menu-category__toggle {
  width: 100%;
}
.menu-category__copy {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-2xs);
}
.menu-category__name {
  font-weight: var(--expressa-font-weight-semibold);
  overflow-wrap: anywhere;
}
.menu-category__count {
  font-size: var(--expressa-font-size-caption);
  color: var(--expressa-color-text-secondary);
}
.menu-category__empty {
  margin: 0;
  padding: var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
</style>
