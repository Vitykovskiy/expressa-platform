<template>
  <div class="admin-combobox">
    <div class="admin-combobox__control">
      <input
        v-bind="attrs"
        :id="inputId"
        ref="input"
        v-model="query"
        :aria-activedescendant="activeId"
        :aria-controls="listboxId"
        :aria-expanded="open"
        :disabled="props.disabled || props.loading"
        aria-autocomplete="list"
        :aria-label="accessibleLabel"
        class="admin-combobox__input"
        :class="{ 'admin-combobox__input--loading': props.loading }"
        role="combobox"
        @focus="openList"
        @keydown="onKeydown"
      />
      <span v-if="props.loading" class="admin-combobox__loader" role="status">
        <v-progress-circular
          aria-label="Загружаем варианты"
          indeterminate
          size="18"
          width="2"
        />
      </span>
    </div>
    <div
      v-if="!props.loading && open"
      :id="listboxId"
      :aria-label="accessibleLabel"
      class="admin-combobox__menu"
      role="listbox"
    >
      <p v-if="matches.length === 0" class="admin-combobox__state">
        Нет вариантов
      </p>
      <button
        v-for="(option, index) in matches"
        v-else
        :id="optionId(index)"
        :key="option.id"
        :aria-selected="option.id === props.modelValue"
        :class="{ 'admin-combobox__option--active': index === activeIndex }"
        class="admin-combobox__option"
        role="option"
        type="button"
        @mousedown.prevent="select(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  shallowRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { ADMIN_COMBOBOX_DEFAULTS } from "./AdminCombobox.constants";
import type {
  AdminComboboxEmits,
  AdminComboboxProps,
} from "./AdminCombobox.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminComboboxProps>(),
  ADMIN_COMBOBOX_DEFAULTS,
);
const emit = defineEmits<AdminComboboxEmits>();
const attrs = useAttrs();
const id = useId();
const input = useTemplateRef<HTMLInputElement>("input");
const accessibleLabel = computed(
  () =>
    props.label ||
    (typeof attrs["aria-label"] === "string" ? attrs["aria-label"] : undefined),
);
const inputId = computed(() =>
  typeof attrs.id === "string" ? attrs.id : `admin-combobox-${id}`,
);
const listboxId = `admin-combobox-listbox-${id}`;
const open = shallowRef(false);
const query = shallowRef("");
const activeIndex = shallowRef(-1);
const selectedLabel = computed(
  () =>
    props.options.find((option) => option.id === props.modelValue)?.label ?? "",
);
const matches = computed(() =>
  props.options
    .filter((option) =>
      option.label
        .toLocaleLowerCase("ru")
        .includes(query.value.toLocaleLowerCase("ru")),
    )
    .slice(0, 50),
);
const activeId = computed(() =>
  activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
);

function optionId(index: number): string {
  return `admin-combobox-option-${id}-${index}`;
}

function openList(): void {
  open.value = true;
  activeIndex.value = matches.value.findIndex(
    (option) => option.id === props.modelValue,
  );
}

function select(value: string): void {
  emit("update:modelValue", value);
  query.value =
    props.options.find((option) => option.id === value)?.label ?? "";
  open.value = false;
  activeIndex.value = -1;
  input.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (props.loading) {
    if (event.key === "Escape") open.value = false;
    return;
  }

  const total = matches.value.length;
  if (event.key === "Escape") {
    open.value = false;
    query.value = selectedLabel.value;
    activeIndex.value = -1;
    return;
  }
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    open.value = true;
    if (!total) return;
    if (event.key === "Home") activeIndex.value = 0;
    else if (event.key === "End") activeIndex.value = total - 1;
    else
      activeIndex.value =
        event.key === "ArrowDown"
          ? (activeIndex.value + 1 + total) % total
          : (activeIndex.value - 1 + total) % total;
    return;
  }
  if (event.key === "Enter" && open.value && activeIndex.value >= 0) {
    event.preventDefault();
    select(matches.value[activeIndex.value]!.id);
  }
}

watch(query, () => {
  activeIndex.value = matches.value.length ? 0 : -1;
});
watch(
  () => props.modelValue,
  () => {
    query.value = selectedLabel.value;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.admin-combobox {
  position: relative;
}
.admin-combobox__control {
  position: relative;
}
.admin-combobox__input {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
}
.admin-combobox__input--loading {
  padding-inline-end: calc(
    var(--expressa-space-control-inline) +
      var(--expressa-size-control-min-height)
  );
}
.admin-combobox__loader {
  position: absolute;
  inset-inline-end: var(--expressa-space-control-inline);
  inset-block-start: 50%;
  display: grid;
  color: var(--expressa-color-primary);
  transform: translateY(-50%);
}
.admin-combobox__input:disabled {
  cursor: not-allowed;
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
}
.admin-combobox__input:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}
.admin-combobox__menu {
  position: absolute;
  z-index: var(--expressa-z-popover-layer);
  width: 100%;
  max-height: var(--expressa-size-combobox-menu-max-block);
  margin-top: var(--expressa-space-xs);
  overflow: auto;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-menu);
}
.admin-combobox__option {
  display: block;
  width: 100%;
  min-height: var(--expressa-size-option);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-none);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-transparent);
  font: inherit;
  text-align: start;
  overflow-wrap: anywhere;
}
.admin-combobox__option--active,
.admin-combobox__option:hover {
  background: var(--expressa-color-control-hover-surface);
}
.admin-combobox__option:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: calc(-1 * var(--expressa-border-width-strong));
}
.admin-combobox__state {
  margin: 0;
  padding: var(--expressa-space-control-inline);
  color: var(--expressa-color-text-secondary);
}
</style>
