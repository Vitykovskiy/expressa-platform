<template>
  <v-progress-circular
    v-if="props.kind === 'circular'"
    v-bind="{ ...$attrs, ...aria }"
    class="ui-progress"
    :color="props.color"
    :indeterminate="props.indeterminate"
    :model-value="value"
  /><v-progress-linear
    v-else
    v-bind="{ ...$attrs, ...aria }"
    class="ui-progress"
    :color="props.color"
    :indeterminate="props.indeterminate"
    :model-value="value"
    :rounded="props.rounded"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { UI_PROGRESS_DEFAULTS } from "./UiProgress.constants";
import type { UiProgressProps } from "./UiProgress.types";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<UiProgressProps>(),
  UI_PROGRESS_DEFAULTS,
);
const value = computed(() => Math.min(100, Math.max(0, props.modelValue)));
const aria = computed(() =>
  props.indeterminate
    ? { "aria-busy": "true", "aria-label": props.label }
    : {
        "aria-label": props.label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": value.value,
      },
);
</script>
<style scoped>
.ui-progress {
  width: 100%;
}
</style>
