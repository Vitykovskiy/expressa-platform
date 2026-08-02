<template>
  <main class="page">
    <AppHeader title="История заказов" :cart-count="0" @cart="emit('cart')" />
    <OrderHistoryList
      :orders="orders"
      :loading="state === 'loading'"
      :error="state === 'error' ? 'Не удалось загрузить историю.' : undefined"
      @repeat="repeat"
    />
    <RepeatOrderResult
      v-if="repeatResult"
      v-bind="repeatResult"
      @confirm="repeatResult = undefined"
    />
    <UiButton v-if="state === 'ready' && hasNextPage" @click="emit('nextPage')"
      >Показать ещё</UiButton
    >
  </main>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import UiButton from "../../shared/ui/UiButton.vue";
import RepeatOrderResult from "../domain-ui/Orders/RepeatOrderResult.vue";
import AppHeader from "../domain-ui/Navigation/AppHeader.vue";
import OrderHistoryList from "../domain-ui/Orders/OrderHistoryList.vue";
type Stage = "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
export interface Order {
  number: string;
  date: string;
  stage: Stage;
  total: number;
}
export interface RepeatResult {
  status: "full" | "partial" | "unavailable";
  added: number;
  skipped?: readonly string[];
}
withDefaults(
  defineProps<{
    orders: readonly Order[];
    state?: "ready" | "loading" | "error";
    hasNextPage?: boolean;
  }>(),
  { state: "ready", hasNextPage: false },
);
const emit = defineEmits<{
  cart: [];
  nextPage: [];
  repeat: [number: string];
}>();
const repeatResult = shallowRef<RepeatResult | undefined>();
function repeat(number: string): void {
  emit("repeat", number);
  repeatResult.value =
    number === "#101"
      ? { status: "full", added: 2 }
      : number === "#100"
        ? {
            status: "partial",
            added: 1,
            skipped: ["Сезонный раф: больше недоступен"],
          }
        : {
            status: "unavailable",
            added: 0,
            skipped: ["Все позиции больше недоступны"],
          };
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
