<template>
  <span class="operations-badge" :class="badgeClass">{{ props.label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OperationsBadgeProps } from "./OperationsBadge.types";
import "./operations.tokens.css";

const props = defineProps<OperationsBadgeProps>();
const badgeClass = computed(() => `operations-badge--${props.tone}`);
</script>

<style scoped>
/* Отступы и типографика сохраняют компактную метку стадии в карточке заказа;
   для них нет tokens. Семантические цвета и pill-радиус используют общую тему. */
.operations-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--operations-radius-pill);
  font-family: Inter, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
}
.operations-badge--created {
  background: var(--operations-created-surface);
  color: var(--color-primary);
}
.operations-badge--confirmed {
  background: var(--operations-confirmed-surface);
  color: var(--operations-confirmed-foreground);
}
.operations-badge--ready {
  background: var(--operations-ready-surface);
  color: var(--operations-ready-foreground);
}
.operations-badge--rejected {
  background: var(--operations-danger-surface);
  color: var(--color-danger);
}
.operations-badge--closed {
  background: var(--operations-closed-surface);
  color: var(--color-foreground-muted);
}
</style>
