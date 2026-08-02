<template>
  <div class="action-bar">
    <UiButton
      v-if="next"
      :disabled="loading"
      :loading="loading"
      @click="emit('advance', next)"
      >{{ actionLabel }}</UiButton
    >
    <p v-else role="status">Заказ выдан. Действий нет.</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import type { OrderStatus } from "./OrderQueueCard.vue";
const props = withDefaults(
  defineProps<{ status: OrderStatus; loading?: boolean }>(),
  { loading: false },
);
const emit = defineEmits<{ advance: [status: OrderStatus] }>();
const transitions: Record<OrderStatus, OrderStatus | undefined> = {
  created: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "issued",
  issued: undefined,
};
const names: Record<OrderStatus, string> = {
  created: "Принять",
  accepted: "Начать готовить",
  preparing: "Отметить готовым",
  ready: "Выдать",
  issued: "",
};
const next = computed(() => transitions[props.status]);
const actionLabel = computed(() => names[props.status]);
</script>
<style scoped>
.action-bar {
  min-height: var(--expressa-touch-target-min);
}
</style>
