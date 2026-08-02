<template>
  <span class="order-status-badge" :class="`order-status-badge--${status}`">{{
    labels[status]
  }}</span>
</template>

<script setup lang="ts">
const labels = {
  created: "Оформлен",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  issued: "Выдан",
} as const;
defineProps<{ status: keyof typeof labels }>();
</script>

<style scoped>
.order-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: var(--expressa-touch-target-min);
  padding: 0 var(--expressa-space-2);
  border: 0.125rem solid currentColor;
  border-radius: var(--expressa-radius-control);
  font-weight: var(--expressa-font-weight-strong);
}
.order-status-badge--created {
  color: var(--expressa-status-created-foreground);
  background: var(--expressa-status-created-background);
}
.order-status-badge--accepted {
  color: var(--expressa-status-accepted-foreground);
  background: var(--expressa-status-accepted-background);
}
.order-status-badge--preparing {
  color: var(--expressa-status-preparing-foreground);
  background: var(--expressa-status-preparing-background);
}
.order-status-badge--ready {
  color: var(--expressa-status-ready-foreground);
  background: var(--expressa-status-ready-background);
}
.order-status-badge--issued {
  color: var(--expressa-status-issued-foreground);
  background: var(--expressa-status-issued-background);
}
</style>
