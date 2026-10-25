<template>
  <section class="catalog-menu" aria-label="Меню">
    <header class="catalog-menu__title">
      <h1>Меню</h1>
      <p v-if="hasGroups">{{ props.summary }}</p>
    </header>
    <div class="catalog-menu__actions">
      <OperationsButton
        label="Добавить категорию"
        :disabled="cannotCreateCategory"
        @click="emit('createCategory')"
      />
      <OperationsButton
        class="catalog-menu__add-product"
        label="Добавить товар / опцию"
        kind="secondary"
        :disabled="cannotCreateProduct"
        @click="emit('createProduct')"
      />
    </div>
    <p v-if="props.loading" class="catalog-menu__status" role="status">
      Загрузка меню…
    </p>
    <div v-else-if="props.error" class="catalog-menu__status" role="alert">
      <p>{{ props.error }}</p>
      <OperationsButton
        label="Повторить"
        kind="secondary"
        @click="emit('retry')"
      />
    </div>
    <template v-if="hasGroups">
      <section
        v-if="hasCategories"
        class="catalog-menu__section"
        aria-label="Основное меню"
      >
        <h2>ОСНОВНОЕ МЕНЮ</h2>
        <div class="catalog-menu__groups">
          <CatalogGroup
            v-for="group in props.categories"
            :key="group.id"
            :group="group"
            :disabled="props.disabled"
            @edit="emit('editCategory', $event)"
            @edit-item="emit('editProduct', $event)"
          />
        </div>
      </section>
      <section
        v-if="hasOptionGroups"
        class="catalog-menu__section"
        aria-label="Группы опций"
      >
        <h2>ГРУППЫ ОПЦИЙ</h2>
        <div class="catalog-menu__groups">
          <CatalogGroup
            v-for="group in props.optionGroups"
            :key="group.id"
            :group="group"
            :disabled="props.disabled"
            @edit="emit('editOptionGroup', $event)"
            @edit-item="emit('editProduct', $event)"
          />
        </div>
      </section>
    </template>
    <div v-else-if="confirmedEmpty" class="catalog-menu__empty">
      <img :src="CATALOG_ASSETS.empty" alt="" />
      <h2>Меню пусто</h2>
      <p>Добавьте первую группу для начала работы</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import CatalogGroup from "./CatalogGroup.vue";
import { CATALOG_ASSETS } from "./CatalogMenu.constants";
import type { CatalogMenuEmits, CatalogMenuProps } from "./CatalogMenu.types";

const props = defineProps<CatalogMenuProps>();
const emit = defineEmits<CatalogMenuEmits>();

const hasCategories = computed(() => props.categories.length > 0);
const hasOptionGroups = computed(() => props.optionGroups.length > 0);
const hasGroups = computed(() => hasCategories.value || hasOptionGroups.value);

const cannotCreateCategory = computed(
  () => props.disabled || props.loading || props.error !== null,
);

const cannotCreateProduct = computed(
  () => cannotCreateCategory.value || !hasGroups.value,
);

// Сохранённые группы остаются видимыми при ошибке обновления; пустота подтверждается отдельно.
const confirmedEmpty = computed(
  () => !hasGroups.value && !props.loading && props.error === null,
);
</script>

<style scoped>
.catalog-menu {
  max-width: 1008px;
  padding: 24px;
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
.catalog-menu__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.catalog-menu__title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
}
.catalog-menu__title p {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
.catalog-menu__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 0 12px;
}
.catalog-menu__add-product {
  min-width: 145px;
}
.catalog-menu__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
}
.catalog-menu__section h2 {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.catalog-menu__groups {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
}
.catalog-menu__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 48px 24px;
  text-align: center;
}
.catalog-menu__empty img {
  display: block;
}
.catalog-menu__empty h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.catalog-menu__empty p,
.catalog-menu__status {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
.catalog-menu__status {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 24px 0;
}
@media (max-width: 767px) {
  .catalog-menu {
    min-height: 100%;
    max-width: none;
    padding: 0 16px 16px;
    background: var(--color-background);
  }
  .catalog-menu__title {
    position: sticky;
    z-index: 1;
    top: 0;
    height: 52px;
    margin: 0 -16px;
    padding: 0 16px;
    align-items: center;
    background: var(--color-surface);
  }
  .catalog-menu__title h1 {
    font-size: 18px;
    font-weight: 600;
    line-height: 28px;
  }
  .catalog-menu__title p {
    display: none;
  }
  .catalog-menu__add-product {
    min-width: 155px;
  }
}
</style>
