<template>
  <div
    class="ui-feedback"
    :class="kindClass"
    :role="role"
    :aria-busy="kind === 'loading' || undefined"
  >
    <VIcon
      class="ui-feedback__icon"
      :icon="icon"
      :size="'var(--icon-size)'"
      aria-hidden="true"
    />
    <p class="ui-feedback__text">{{ text }}</p>
    <div v-if="$slots.action" class="ui-feedback__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VIcon } from "vuetify/components";
import { feedbackIcons } from "./UiFeedback.constants";
import type { UiFeedbackProps, UiFeedbackSlots } from "./UiFeedback.types";

const props = defineProps<UiFeedbackProps>();

defineSlots<UiFeedbackSlots>();

const icon = computed(() => feedbackIcons[props.kind]);
const kindClass = computed(() => `ui-feedback--${props.kind}`);
const role = computed(() =>
  props.announced ? (props.kind === "error" ? "alert" : "status") : undefined,
);
</script>

<style scoped>
.ui-feedback {
  display: grid;
  grid-template-columns: var(--icon-size) minmax(0, 1fr);
  align-items: start;
  gap: var(--space-sm);
  color: var(--color-foreground-muted);
}
.ui-feedback__text {
  margin: 0;
  font-size: var(--font-label);
  line-height: var(--line-body);
  overflow-wrap: anywhere;
}
.ui-feedback__action {
  grid-column: 2;
}
.ui-feedback--error {
  color: var(--color-danger);
}
.ui-feedback__icon {
  margin-block-start: var(--border-width);
}
</style>
