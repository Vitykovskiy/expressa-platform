<template>
  <section class="repeat" :class="statusClass">
    <h2>{{ message }}</h2>
    <p v-if="canConfirm">В корзину добавлено: {{ added }}.</p>
    <ul v-if="hasSkipped">
      <li v-for="item in skipped" :key="item">{{ item }}</li>
    </ul>
    <button v-if="canConfirm" type="button" @click="emit('confirm')">
      Подтвердить замену корзины
    </button>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ name: "FoRepeatOrderResult" });
type Status = "full" | "partial" | "unavailable";
const props = withDefaults(
  defineProps<{ status: Status; added: number; skipped?: readonly string[] }>(),
  { skipped: () => [] },
);
const emit = defineEmits<{ confirm: [] }>();
const messages: Record<Status, string> = {
  full: "Все позиции доступны",
  partial: "Часть позиций недоступна",
  unavailable: "Повторить нечего",
};
const message = computed(() => messages[props.status]);
const canConfirm = computed(() => props.status !== "unavailable");
const hasSkipped = computed(() => props.skipped.length > 0);
const statusClass = computed(() => `repeat--${props.status}`);
</script>
<style scoped>
.repeat {
  display: grid;
  gap: var(--fo-space-2);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  font: 400 1rem/1.3 var(--fo-font);
}
.repeat h2,
.repeat p,
.repeat ul {
  margin: 0;
  overflow-wrap: anywhere;
}
.repeat--partial {
  border-color: var(--fo-accent);
}
.repeat--unavailable {
  border-color: var(--fo-danger);
}
.repeat button {
  justify-self: start;
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-surface);
  background: var(--fo-brand);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>
