<template>
  <li class="customer-row">
    <span class="customer-row__avatar">{{ props.customer.initials }}</span>
    <div class="customer-row__identity">
      <span class="customer-row__name">{{ props.customer.name }}</span>
      <p class="customer-row__phone">{{ props.customer.phone }}</p>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { CustomerRowProps } from "./CustomerRow.types";

const props = defineProps<CustomerRowProps>();
</script>

<style scoped>
/* Геометрия и нейтральный avatar взяты из Customers 40:1301/40:2419;
   шкал этих размеров и цвета разделителя в теме нет. */
.customer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.customer-row:last-child {
  border-bottom: 0;
}
.customer-row__avatar {
  display: flex;
  flex: 0 0 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--operations-radius-pill);
  color: var(--color-foreground-muted);
  background: #f0f0f0;
  font:
    600 12px/16px Inter,
    sans-serif;
}
.customer-row__identity {
  flex: 1;
  min-width: 0;
}
.customer-row__name {
  color: var(--color-foreground);
  font:
    600 14px/20px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.customer-row__phone {
  margin: 2px 0 0;
  color: var(--color-foreground-muted);
  font:
    400 12px/16px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
</style>
