<template>
  <article class="card">
    <button class="open" type="button" @click="emit('open')">
      <strong>Заказ {{ number }}</strong
      ><span>{{ date }}</span
      ><PriceLabel :amount="total" /></button
    ><OrderStage :stage="stage" /><button
      v-if="isIssued"
      class="repeat"
      type="button"
      @click="emit('repeat')"
    >
      Повторить
    </button>
  </article>
</template>
<script setup lang="ts">
import { computed } from "vue";
import PriceLabel from "../Menu/PriceLabel.vue";
import OrderStage from "./OrderStage.vue";
defineOptions({ name: "FoOrderCard" });
type Stage = "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
const props = defineProps<{
  number: string;
  date: string;
  stage: Stage;
  total: number;
}>();
const emit = defineEmits<{ open: []; repeat: [] }>();
const isIssued = computed(() => props.stage === "ISSUED");
</script>
<style scoped>
.card {
  display: grid;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  font: 400 1rem/1.3 var(--fo-font);
}
.open {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--fo-space-1);
  border: 0;
  padding: 0;
  color: var(--fo-text);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.open strong {
  overflow-wrap: anywhere;
}
.open span {
  color: var(--fo-muted);
  font-size: 0.875rem;
}
.repeat {
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
