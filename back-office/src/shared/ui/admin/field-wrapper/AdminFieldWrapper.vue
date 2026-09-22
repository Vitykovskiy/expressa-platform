<template>
  <div
    class="admin-field-wrapper"
    :class="`admin-field-wrapper--${props.layout}`"
  >
    <label :id="labelId" :for="props.id" class="admin-field-wrapper__label">
      {{ props.label }}
      <span v-if="props.required" aria-hidden="true"> *</span>
    </label>
    <slot
      :control-id="props.id"
      :described-by="describedBy"
      :invalid="Boolean(props.error)"
      :label-id="labelId"
      :required="props.required"
    />
    <div v-if="props.error" class="admin-field-wrapper__support">
      <p
        v-if="props.error"
        :id="errorId"
        class="admin-field-wrapper__error"
        role="alert"
      >
        {{ props.error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AdminFieldWrapperProps } from "./AdminFieldWrapper.types";

const props = withDefaults(defineProps<AdminFieldWrapperProps>(), {
  error: "",
  layout: "stack",
  required: false,
});

const errorId = `${props.id}-error`;
const labelId = `${props.id}-label`;
const describedBy = computed(() => (props.error ? errorId : undefined));
</script>

<style scoped lang="scss">
.admin-field-wrapper {
  display: grid;
  gap: var(--expressa-space-field-label);
}
.admin-field-wrapper__label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-control);
}
.admin-field-wrapper__support {
  display: grid;
  gap: var(--expressa-space-field-label);
}
.admin-field-wrapper--row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}
.admin-field-wrapper--row > .admin-field-wrapper__support {
  grid-column: 1 / -1;
}
.admin-field-wrapper__error {
  margin: 0;
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-control);
}
.admin-field-wrapper__error {
  color: var(--expressa-color-status-error);
}
</style>
