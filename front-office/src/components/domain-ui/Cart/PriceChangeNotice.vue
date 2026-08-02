<template>
  <aside class="notice" role="alert">
    <strong>Цена изменилась: {{ name }}</strong
    ><span
      ><s><PriceLabel :amount="oldPrice" /></s>
      <PriceLabel :amount="newPrice" /></span
    ><button type="button" @click="emit('confirm')">Подтвердить цену</button>
  </aside>
</template>
<script setup lang="ts">
import PriceLabel from "../Menu/PriceLabel.vue";
defineOptions({ name: "FoPriceChangeNotice" });
defineProps<{ name: string; oldPrice: number; newPrice: number }>();
const emit = defineEmits<{ confirm: [] }>();
</script>
<style scoped>
.notice {
  display: grid;
  gap: var(--fo-space-2);
  padding: var(--fo-space-3);
  border-left: 0.25rem solid var(--fo-accent);
  background: var(--fo-surface-muted);
  color: var(--fo-text);
  font: 400 0.875rem/1.3 var(--fo-font);
  overflow-wrap: anywhere;
}
.notice button {
  justify-self: start;
  min-height: 2.75rem;
  border: 1px solid var(--fo-brand);
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-brand-dark);
  background: var(--fo-surface);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>
