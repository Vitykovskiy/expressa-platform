<template>
  <v-btn
    v-bind="$attrs"
    class="ui-btn"
    :disabled="props.disabled"
    :loading="props.loading"
    :type="props.type"
    @click="emit('click', $event)"
  >
    <template v-if="$slots.loader" #loader>
      <slot name="loader" />
    </template>
    <slot />
  </v-btn>
</template>

<script setup lang="ts">
import { UI_BTN_DEFAULTS } from "./UiBtn.constants";
import type { UiBtnEmits, UiBtnProps } from "./UiBtn.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiBtnProps>(), UI_BTN_DEFAULTS);
const emit = defineEmits<UiBtnEmits>();
defineSlots<{
  default(): unknown;
  loader?(): unknown;
}>();
</script>

<style scoped lang="scss">
.ui-btn {
  min-height: 44px;
  font: inherit;
}
</style>
