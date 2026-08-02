<template>
  <button class="menu-row" type="button" @click="emit('open', category.id)">
    <strong>{{ category.name }}</strong
    ><span>{{
      category.archived ? "Архив" : category.active ? "Активна" : "Неактивна"
    }}</span>
  </button>
</template>
<script setup lang="ts">
export interface Category {
  id: string;
  name: string;
  active: boolean;
  archived: boolean;
}
defineProps<{ category: Category }>();
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
