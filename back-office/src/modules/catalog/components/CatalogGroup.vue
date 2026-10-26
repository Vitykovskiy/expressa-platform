<template>
  <section class="catalog-group">
    <div class="catalog-group__header">
      <button
        class="catalog-group__expand"
        type="button"
        :aria-expanded="expanded"
        :aria-controls="itemsId"
        @click="expanded = !expanded"
      >
        <img :src="chevron" alt="" />
        <span class="catalog-group__label">
          <span class="catalog-group__name">{{ props.group.name }}</span>
          <span class="catalog-group__count">{{ props.group.countLabel }}</span>
        </span>
      </button>
      <button
        class="catalog-group__edit"
        type="button"
        :aria-label="editLabel"
        :disabled="props.disabled"
        @click="emit('edit', props.group.id)"
      >
        <img :src="CATALOG_ASSETS.edit" alt="" />
      </button>
    </div>
    <div v-show="expanded" :id="itemsId">
      <button
        v-for="item in props.group.items"
        :key="item.id"
        class="catalog-group__item"
        type="button"
        :disabled="props.disabled"
        @click="emit('editItem', { kind: item.kind, id: item.id })"
      >
        <span class="catalog-group__label">
          <span class="catalog-group__item-name">{{ item.name }}</span>
          <span class="catalog-group__count">{{ item.priceLabel }}</span>
        </span>
        <img :src="CATALOG_ASSETS.product" alt="" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { CATALOG_ASSETS } from "./CatalogMenu.constants";
import type { CatalogGroupEmits, CatalogGroupProps } from "./CatalogMenu.types";

const props = defineProps<CatalogGroupProps>();
const emit = defineEmits<CatalogGroupEmits>();
const itemsId = useId();
// Раскрытие группы — локальное состояние просмотра, независимое от запрета редактирования.
const expanded = ref(false);

const chevron = computed(() =>
  expanded.value ? CATALOG_ASSETS.expanded : CATALOG_ASSETS.collapsed,
);

const editLabel = computed(() => `Редактировать: ${props.group.name}`);
</script>

<style scoped>
.catalog-group + .catalog-group {
  border-top: 1px solid var(--color-border);
}
.catalog-group__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--color-background);
}
.catalog-group__expand {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.catalog-group__label {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.catalog-group__name,
.catalog-group__item-name {
  color: var(--color-foreground);
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 600;
  line-height: 22.5px;
}
.catalog-group__item-name {
  font-size: 14px;
  line-height: 20px;
}
.catalog-group__count {
  color: var(--color-foreground-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}
.catalog-group__edit {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.catalog-group__edit::before {
  position: absolute;
  inset: -9px;
  content: "";
}
.catalog-group__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 12px 12px 48px;
  border: 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
}
.catalog-group img {
  display: block;
  flex: none;
}
.catalog-group button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.catalog-group button:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
@media (max-width: 767px) {
  .catalog-group__edit {
    /* Отступ после иконки сохраняет исходную узкую компоновку; token для 18px отсутствует. */
    margin-right: 18px;
  }
}
</style>
