<template>
  <v-alert
    v-if="props.message"
    v-bind="$attrs"
    class="ui-field-message"
    :color="color"
    density="compact"
    :role="props.tone === 'error' ? 'alert' : 'status'"
    :aria-live="props.tone === 'error' ? 'assertive' : 'polite'"
    variant="tonal"
    >{{ props.message }}</v-alert
  >
</template>

<script setup lang="ts">
import { computed } from "vue";
import { UI_FIELD_MESSAGE_COLORS } from "./UiFieldMessage.constants";
import type { UiFieldMessageProps } from "./UiFieldMessage.types";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<UiFieldMessageProps>(), {
  message: "",
  tone: "neutral",
});
const color = computed(() => UI_FIELD_MESSAGE_COLORS[props.tone]);
</script>
<style scoped>
.ui-field-message {
  width: 100%;
}
</style>
