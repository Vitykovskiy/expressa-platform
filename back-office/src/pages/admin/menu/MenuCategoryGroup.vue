<template>
  <section
    ref="root"
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
        :aria-expanded="props.expanded"
        :aria-label="`Открыть категорию ${props.category.name}`"
        @click="emit('toggle', props.category)"
        ><ChevronDown
          v-if="props.expanded"
          :size="18"
          aria-hidden="true"
        /><ChevronRight v-else :size="18" aria-hidden="true" /><span
          class="menu-category__copy"
          ><span class="menu-category__name">{{ props.category.name }}</span
          ><span class="menu-category__count">{{ countLabel }}</span></span
        ></AdminButton
      ><AdminButton
        class="menu-category__desktop-edit"
        type="button"
        variant="ghost"
        :disabled="props.disabled"
        :aria-label="`Редактировать категорию ${props.category.name}`"
        @click="emit('edit-category', props.category)"
        >Редактировать</AdminButton
      ><button
        ref="moreTrigger"
        class="menu-category__more"
        type="button"
        :disabled="props.disabled"
        :aria-expanded="overflowOpen"
        :aria-label="`Действия: ${props.category.name}`"
        @click="openOverflow"
      >
        Ещё
      </button>
      <div
        v-if="overflowOpen"
        class="menu-category__menu"
        role="menu"
        :aria-label="`Действия с категорией ${props.category.name}`"
        @keydown.escape.stop="closeOverflow"
      >
        <button
          ref="menuItem"
          role="menuitem"
          type="button"
          :aria-label="`Редактировать категорию ${props.category.name}`"
          @click="selectEdit"
        >
          Редактировать
        </button>
      </div>
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
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import MenuProductRow from "./MenuProductRow.vue";
import { productCountLabel } from "./catalog-formatters";
import type {
  MenuCategoryGroupEmits,
  MenuCategoryGroupProps,
} from "./MenuCategoryGroup.types";
const props = defineProps<MenuCategoryGroupProps>();
const emit = defineEmits<MenuCategoryGroupEmits>();
const overflowOpen = ref(false),
  root = ref<HTMLElement | null>(null),
  moreTrigger = ref<HTMLButtonElement | null>(null),
  menuItem = ref<HTMLButtonElement | null>(null);
const countLabel = computed(() => productCountLabel(props.products.length));
function closeOverflow() {
  overflowOpen.value = false;
  void nextTick(() => moreTrigger.value?.focus());
}
function openOverflow() {
  overflowOpen.value = true;
  void nextTick(() => menuItem.value?.focus());
}
function selectEdit() {
  overflowOpen.value = false;
  void nextTick(() => {
    moreTrigger.value?.focus();
    emit("edit-category", props.category);
  });
}
function outside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node))
    overflowOpen.value = false;
}
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) overflowOpen.value = false;
  },
);
document.addEventListener("pointerdown", outside);
onBeforeUnmount(() => document.removeEventListener("pointerdown", outside));
</script>
<style scoped lang="scss">
.menu-category {
  position: relative;
  overflow: visible;
  background: var(--expressa-color-surface);
}
.menu-category--highlighted {
  .menu-category__header {
    animation: category-highlight 2s ease-out;
  }
}
@keyframes category-highlight {
  from {
    background: var(--expressa-color-status-success-surface);
  }
  to {
    background: var(--expressa-color-surface);
  }
}
.menu-category__header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  block-size: 64px;
  background: var(--expressa-color-surface-raised);
}
.menu-category__toggle {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  text-align: left;
}
.menu-category__copy {
  display: grid;
  min-width: 0;
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
.menu-category__desktop-edit,
.menu-category__more {
  min-inline-size: 44px;
  min-block-size: 44px;
  margin-inline-end: 16px;
  border: 0;
  background: transparent;
  color: var(--expressa-color-accent);
  font: inherit;
}
.menu-category__more,
.menu-category__menu {
  display: none;
}
.menu-category__empty {
  margin: 0;
  padding: 16px;
  border-top: 1px solid var(--expressa-color-border);
}
@media (max-width: 767px) {
  .menu-category__desktop-edit {
    display: none;
  }
  .menu-category__more {
    display: block;
    margin-inline-end: 10px;
  }
  .menu-category__menu {
    position: absolute;
    z-index: 3;
    inset-block-start: 56px;
    inset-inline-end: 8px;
    display: block;
    min-inline-size: 176px;
    padding: 8px;
    border: 1px solid var(--expressa-color-border);
    border-radius: 12px;
    background: var(--expressa-color-surface);
    box-shadow: var(--expressa-shadow-menu);
  }
  .menu-category__menu button {
    min-block-size: 44px;
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    font: inherit;
  }
}
</style>
