<template>
  <main class="page">
    <AppHeader title="Ваш заказ" :cart-count="0" @cart="emit('history')" />
    <OrderStage :stage="order.stage" /><OrderDetails
      :items="order.items"
      :total="order.total"
    />
    <NotificationPermission
      :permission="displayedPermission"
      @request="requestNotifications"
    />
    <Snackbar
      :open="showUpdate"
      message="Статус заказа обновлён"
      @close="showUpdate = false"
    />
  </main>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
import NotificationPermission from "../domain-ui/Feedback/NotificationPermission.vue";
import Snackbar from "../domain-ui/Feedback/Snackbar.vue";
import AppHeader from "../domain-ui/Navigation/AppHeader.vue";
import OrderDetails from "../domain-ui/Orders/OrderDetails.vue";
import OrderStage from "../domain-ui/Orders/OrderStage.vue";
type Stage = "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
export interface Order {
  stage: Stage;
  total: number;
  items: readonly {
    id: string;
    name: string;
    details?: string;
    quantity: number;
    price: number;
  }[];
}
const props = defineProps<{
  order: Order;
  permission: "default" | "granted" | "denied";
}>();
const emit = defineEmits<{ history: []; requestNotifications: [] }>();
const showUpdate = shallowRef(false);
const displayedPermission = shallowRef(props.permission);
watch(
  () => props.order.stage,
  () => {
    showUpdate.value = true;
  },
);
watch(
  () => props.permission,
  (permission) => {
    displayedPermission.value = permission;
  },
);
function requestNotifications(): void {
  displayedPermission.value = "granted";
  emit("requestNotifications");
}
</script>

<style scoped>
.page {
  display: grid;
  min-height: 100%;
  gap: var(--fo-space-3);
  background: var(--fo-surface-muted);
  color: var(--fo-text);
}
.page > :not(:first-child) {
  margin: 0 var(--fo-space-3);
}
</style>
