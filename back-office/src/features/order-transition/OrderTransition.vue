<template>
  <div v-if="visible" class="order-transition">
    <p v-if="retained">Заказ {{ operation?.number }}</p>
    <p v-if="feedback">{{ feedback }}</p>
    <UiButton
      v-if="recovery"
      variant="secondary"
      :loading="checking"
      :disabled="recoveryBlocked"
      @activate="emit('reconcile')"
      >{{ recovery }}</UiButton
    >
    <UiButton v-else-if="back" variant="secondary" @activate="emit('back')"
      >Назад к заказам</UiButton
    >
    <UiButton
      v-else-if="action !== null"
      :key="action"
      variant="primary"
      :loading="sending"
      :disabled="blocked"
      @activate="activate"
      >{{ orderActionCopy[action].label }}</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import { nextOrderAction } from "../../entities/order/order.constants";
import { orderActionCopy } from "./OrderTransition.constants";
import type {
  OrderTransitionEmits,
  OrderTransitionProps,
} from "./OrderTransition.types";

const props = defineProps<OrderTransitionProps>();
const emit = defineEmits<OrderTransitionEmits>();

const sending = computed(() => props.operation?.status === "sending");
const checking = computed(() => props.operation?.status === "reconciling");
const recovery = computed(() => {
  switch (props.operation?.status) {
    case "failed":
    case "conflict":
      return "Обновить заказ";
    case "unknown":
    case "reconciling":
      return "Проверить заказ";
    default:
      return null;
  }
});
const back = computed(
  () => props.operation?.status === "absent" && !props.showBack,
);
const action = computed(() => {
  if (props.retained || props.order === null) {
    return sending.value ? (props.operation?.action ?? null) : null;
  }

  return nextOrderAction[props.order.stage];
});
const feedback = computed(() => {
  const operation = props.operation;

  if (operation === null) {
    return "";
  }

  if (operation.status === "sending") {
    return orderActionCopy[operation.action].pending;
  }

  if (operation.status === "completed") {
    return orderActionCopy[operation.action].completion;
  }

  return operation.message;
});
const visible = computed(
  () => action.value !== null || props.operation !== null,
);

function activate(event: MouseEvent) {
  if (
    event.detail > 1 ||
    props.blocked ||
    props.order === null ||
    action.value === null
  ) {
    return;
  }

  emit("transition", {
    id: props.order.id,
    from: props.order.stage,
    action: action.value,
  });
}
</script>

<style scoped>
.order-transition {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  margin-block: var(--space-lg);
  overflow-wrap: anywhere;
  font-size: var(--font-data);
}
@media (max-width: 1023px) {
  /* Matches the current ordinary narrow-detail workspace boundary. */
  .order-transition > button {
    inline-size: 100%;
  }
}
</style>
