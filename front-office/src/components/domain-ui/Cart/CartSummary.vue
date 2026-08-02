<template>
  <section class="summary" aria-label="Итог корзины">
    <span>{{ items }} поз.</span><PriceLabel :amount="total" />
  </section>
</template>
<script setup lang="ts">
import PriceLabel from "../Menu/PriceLabel.vue";
defineOptions({ name: "FoCartSummary" });
defineProps<{ items: number; total: number }>();
</script>
<style scoped>
.summary {
  display: flex;
  justify-content: space-between;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border-top: 0.125rem solid var(--fo-text);
  font: 700 1rem/1.2 var(--fo-font);
}
</style>
