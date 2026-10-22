<template>
  <div class="catalog-dialog-header">
    <div class="catalog-dialog-header__row">
      <h2 :id="props.titleId">{{ props.title }}</h2>
      <button
        v-if="props.editing"
        class="catalog-dialog-header__delete"
        type="button"
        :disabled="props.pending"
        :aria-label="props.deleteLabel"
        @click="emit('delete')"
      >
        <img :src="CATALOG_DELETE_ICON" alt="" />
      </button>
    </div>
    <p v-if="props.summary">{{ props.summary }}</p>
  </div>
</template>

<script setup lang="ts">
import { CATALOG_DELETE_ICON } from "./CatalogEditor.constants";
import type {
  CatalogDialogHeaderEmits,
  CatalogDialogHeaderProps,
} from "./CatalogEditor.types";

const props = defineProps<CatalogDialogHeaderProps>();
const emit = defineEmits<CatalogDialogHeaderEmits>();
</script>

<style scoped>
.catalog-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.catalog-dialog-header__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.catalog-dialog-header h2 {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--color-foreground);
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.catalog-dialog-header p {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
.catalog-dialog-header__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.catalog-dialog-header__delete img {
  display: block;
}
.catalog-dialog-header__delete:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
.catalog-dialog-header__delete:focus-visible {
  outline: 2px solid var(--color-primary);
  border-radius: var(--radius-control);
}
</style>
