<template>
  <span class="price-label">{{ priceText }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "FoPriceLabel" });

const props = defineProps<{ amount: number; prefix?: string }>();

const priceText = computed(() => {
  const prefix = props.prefix ? `${props.prefix} ` : "";
  return `${prefix}${props.amount.toLocaleString("ru-RU")} ₽`;
});
</script>

<style scoped>
.price-label {
  color: var(--fo-text);
  white-space: nowrap;
  font: 700 1rem/1.2 var(--fo-font);
}
</style>
