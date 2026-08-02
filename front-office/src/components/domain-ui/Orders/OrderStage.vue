<template>
  <ol class="stages" aria-label="Стадия заказа">
    <li
      v-for="item in stages"
      :key="item.stage"
      :class="{ 'stages-item--complete': item.index <= currentStage }"
    >
      {{ item.label }}
    </li>
  </ol>
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ name: "FoOrderStage" });
type Stage = "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
const props = defineProps<{ stage: Stage }>();
const stageLabels: Record<Stage, string> = {
  CREATED: "Создан",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ISSUED: "Выдан",
};
const stageOrder: readonly Stage[] = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
];
const currentStage = computed(() => stageOrder.indexOf(props.stage));
const stages = computed(() =>
  stageOrder.map((stage, index) => ({
    stage,
    index,
    label: stageLabels[stage],
  })),
);
</script>
<style scoped>
.stages {
  display: flex;
  gap: var(--fo-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font: 400 0.75rem/1.2 var(--fo-font);
}
.stages li {
  flex: 1;
  min-width: 0;
  color: var(--fo-muted);
  text-align: center;
  overflow-wrap: anywhere;
}
.stages li::before {
  content: "";
  display: block;
  height: 0.3rem;
  margin-bottom: var(--fo-space-1);
  border-radius: var(--fo-radius-lg);
  background: var(--fo-border);
}
.stages .stages-item--complete {
  color: var(--fo-brand-dark);
  font-weight: 700;
}
.stages .stages-item--complete::before {
  background: var(--fo-brand);
}
</style>
