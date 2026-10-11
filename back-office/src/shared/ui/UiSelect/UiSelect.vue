<template>
  <div class="ui-field">
    <label :id="labelId" :for="inputId" class="ui-label">{{ label }}</label>
    <VSelect
      v-bind="$attrs"
      :id="inputId"
      class="ui-select"
      :class="{ 'ui-select--error': error }"
      :model-value="modelValue"
      :items="items"
      item-title="label"
      item-value="value"
      :disabled="disabled"
      :error="Boolean(error)"
      :aria-labelledby="labelId"
      :aria-describedby="messageId"
      :aria-invalid="Boolean(error)"
      :menu-props="menuProps"
      variant="plain"
      density="compact"
      rounded="lg"
      hide-details
      color="primary"
      base-color="control-border"
      bg-color="surface"
      :menu-icon="mdiChevronDown"
      no-data-text="Нет вариантов"
      @update:model-value="update"
    >
      <template #item="{ item, props: itemProps }">
        <VListItem
          v-bind="itemProps"
          role="option"
          :aria-disabled="Boolean(itemProps.disabled)"
        >
          <template #title
            ><span class="ui-select__option">{{ item.title }}</span></template
          >
        </VListItem>
      </template>
      <template #selection="{ item }"
        ><span class="ui-select__selection">{{ item.title }}</span></template
      >
    </VSelect>
    <p v-if="error" :id="messageId" class="ui-message ui-message--error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { mdiChevronDown } from "@mdi/js";
import { VListItem, VSelect } from "vuetify/components";
import { useTheme } from "vuetify";
import { selectDefaults, selectMenuProps } from "./UiSelect.constants";
import type { UiSelectEmits, UiSelectProps } from "./UiSelect.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiSelectProps>(), selectDefaults);
const emit = defineEmits<UiSelectEmits>();
const inputId = useId();
const labelId = `${inputId}-label`;
const theme = useTheme();
const menuProps = computed(() => ({
  ...selectMenuProps,
  contentProps: { "data-theme": theme.current.value.dark ? "dark" : "light" },
}));
const messageId = computed(() =>
  props.error ? `${inputId}-error` : undefined,
);
const items = computed(() =>
  props.options.map((option) => ({
    ...option,
    props: { disabled: option.disabled },
  })),
);

function update(value: string | null) {
  if (props.disabled) {
    return;
  }

  emit("update:modelValue", value);
}
</script>

<style scoped>
.ui-select {
  min-inline-size: 0;
  min-block-size: var(--control-height);
  align-items: center;
  font-family: var(--font-family);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--field-radius);
  background: var(--color-surface);
  padding-inline: var(--space-md);
}
.ui-select:has(input:focus-visible) {
  outline: var(--focus-width) solid var(--color-focus);
  outline-offset: var(--focus-offset);
}
.ui-select--error {
  border-color: var(--color-danger);
}
/* Public wrapper owns dimensions; Vuetify's compact field minimum is extended
   with inherited CSS sizing variables, without selecting its private DOM. */
.ui-select {
  --v-input-control-height: var(--control-height);
  --v-field-input-padding-top: var(--space-sm);
  --v-field-input-padding-bottom: var(--space-sm);
}
.ui-select__selection,
.ui-select__option {
  display: block;
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: var(--font-body);
  line-height: var(--line-label);
}
</style>
