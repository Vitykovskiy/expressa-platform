<template>
  <button class="menu-row" type="button" @click="emit('open', product.id)">
    <strong>{{ product.name }}</strong
    ><span>{{
      product.archived ? "Архив" : product.active ? "Активен" : "Неактивен"
    }}</span>
  </button>
</template>
<script setup lang="ts">
export interface Product {
  id: string;
  name: string;
  active: boolean;
  archived: boolean;
}
defineProps<{ product: Product }>();
const emit = defineEmits<{ open: [id: string] }>();
</script>
<style scoped>
.menu-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  min-height: var(--expressa-touch-target-min);
  padding: var(--expressa-space-2);
  background: transparent;
  color: inherit;
  border: 1px solid rgb(var(--v-theme-outline));
  text-align: left;
}
</style>
