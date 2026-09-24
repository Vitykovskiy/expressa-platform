<template>
  <section
    class="menu-category"
    :class="{ 'menu-category--highlighted': props.highlighted }"
  >
    <header class="menu-category__header">
      <AdminButton
        :id="`category-toggle-${props.category.id}`"
        class="menu-category__toggle"
        type="button"
        variant="ghost"
        :disabled="props.disabled"
        @click="emit('toggle', props.category)"
        ><AdminIcon
          :icon="props.expanded ? ChevronDown : ChevronRight" /></AdminButton
      ><AdminButton
        class="menu-category__label"
        type="button"
        variant="ghost"
        :disabled="props.disabled"
        @click="openCategoryLabel"
        ><span class="menu-category__copy"
          ><span ref="labelText" class="menu-category__name">{{
            props.category.name
          }}</span
          ><span class="menu-category__count">{{ countLabel }}</span></span
        ></AdminButton
      ><AdminButton
        class="menu-category__edit"
        type="button"
        variant="ghost"
        :disabled="props.disabled"
        @click="emit('edit-category', props.category)"
        ><AdminIcon :icon="Pencil" /><span class="menu-category__edit-label"
          >Редактировать</span
        ></AdminButton
      >
    </header>
    <div v-if="props.expanded">
      <p v-if="props.products.length === 0" class="menu-category__empty">
        Товаров в этой категории пока нет
      </p>
      <MenuProductRow
        v-for="product in props.products"
        v-else
        :key="product.id"
        :product="product"
        :can-move-up="false"
        :can-move-down="false"
        :disabled="props.disabled"
        @edit="emit('edit', $event)"
        @show-label="emit('showLabel', $event)"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from "vue";
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
const labelText = shallowRef<HTMLElement | null>(null);
const isTruncated = shallowRef(false);
let labelObserver: ResizeObserver | null = null;

function updateTruncation(): void {
  const text = labelText.value;
  isTruncated.value = text !== null && text.scrollWidth > text.clientWidth + 1;
}

function openCategoryLabel(): void {
  if (isTruncated.value) emit("showLabel", props.category.name);
  else emit("toggle", props.category);
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
  () => props.category.name,
  () => void nextTick(updateTruncation),
);
</script>
<style scoped lang="scss">
.menu-category {
  position: relative;
  overflow: hidden;
  background: var(--expressa-color-surface);
}
.menu-category + .menu-category {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-category--highlighted {
  .menu-category__header {
    background: var(--expressa-color-status-success-surface);
  }
}
.menu-category__header {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-block-size: 68px;
  background: var(--expressa-color-surface-raised);
}
.menu-category__header:hover {
  background: var(--expressa-color-control-hover-surface);
}
.menu-category__toggle {
  display: inline-flex;
  min-inline-size: var(--expressa-size-control-min-height);
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  padding-inline: var(--expressa-space-sm);
}
.menu-category__label {
  display: flex;
  min-width: 0;
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  padding-inline: var(--expressa-space-2xs);
  text-align: left;
}
.menu-category__copy {
  display: grid;
  min-width: 0;
  width: 100%;
  text-align: left;
}
.menu-category__name,
.menu-category__count {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-category__name {
  font-weight: var(--expressa-font-weight-semibold);
}
.menu-category__count,
.menu-category__empty {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.menu-category__edit {
  display: inline-flex;
  min-inline-size: var(--expressa-size-control-min-height);
  min-block-size: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  margin-inline-end: var(--expressa-space-md);
  color: var(--expressa-color-accent);
}
.menu-category__edit-label {
  display: none;
}
.menu-category__empty {
  margin: 0;
  padding: var(--expressa-space-md);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
@media (max-width: 767px) {
  .menu-category__edit-label {
    display: none;
  }
  .menu-category__edit {
    margin-inline-end: var(--expressa-space-sm);
  }
}
</style>
