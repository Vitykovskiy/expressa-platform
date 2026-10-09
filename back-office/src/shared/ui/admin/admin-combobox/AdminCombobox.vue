<template>
  <div ref="root" class="admin-combobox">
    <div class="admin-combobox__control">
      <input
        v-bind="attrs"
        :id="inputId"
        v-model="query"
        :disabled="props.disabled || props.loading"
        class="admin-combobox__input"
        :class="{ 'admin-combobox__input--loading': props.loading }"
        @click="openList"
        @input="onInput"
      />
      <AdminIcon
        v-if="!props.loading"
        :icon="ChevronDown"
        class="admin-combobox__chevron"
      />
      <span v-if="props.loading" class="admin-combobox__loader">
        <span class="admin-combobox__spinner" />
      </span>
    </div>
    <div v-if="!props.loading && open" class="admin-combobox__menu">
      <p v-if="matches.length === 0" class="admin-combobox__state">
        Нет вариантов
      </p>
      <button
        v-for="option in matches"
        v-else
        :key="option.id"
        :class="{
          'admin-combobox__option--active': option.id === props.modelValue,
        }"
        class="admin-combobox__option"
        type="button"
        @click="select(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { ChevronDown } from "lucide-vue-next";
import AdminIcon from "../admin-icon/AdminIcon.vue";
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
const root = useTemplateRef<HTMLElement>("root");
const inputId = computed(() =>
  typeof attrs.id === "string" ? attrs.id : `admin-combobox-${id}`,
);
const open = shallowRef(false);
const filtering = shallowRef(false);
const query = shallowRef("");
const selectedLabel = computed(
  () =>
    props.options.find((option) => option.id === props.modelValue)?.label ?? "",
);
const matches = computed(() =>
  (filtering.value
    ? props.options.filter((option) =>
        option.label
          .toLocaleLowerCase("ru")
          .includes(query.value.toLocaleLowerCase("ru")),
      )
    : props.options
  ).slice(0, 50),
);
function openList(): void {
  if (props.disabled || props.loading) return;
  filtering.value = false;
  open.value = true;
}

function onInput(): void {
  filtering.value = true;
  open.value = true;
}

function closeList(): void {
  open.value = false;
  filtering.value = false;
  query.value = selectedLabel.value;
}

function onPointerDown(event: PointerEvent): void {
  if (!root.value?.contains(event.target as Node)) closeList();
}

function select(value: string): void {
  emit("update:modelValue", value);
  query.value =
    props.options.find((option) => option.id === value)?.label ?? "";
  open.value = false;
  filtering.value = false;
}

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", onPointerDown),
);
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
    calc(
      var(--expressa-space-control-inline) + var(--expressa-size-icon-action)
    )
    var(--expressa-space-control-block) var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
  font-size: var(--expressa-font-size-field);
}
.admin-combobox__chevron {
  position: absolute;
  inset-inline-end: var(--expressa-space-control-inline);
  inset-block-start: 50%;
  color: var(--expressa-color-text-secondary);
  pointer-events: none;
  transform: translateY(-50%);
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
.admin-combobox__spinner {
  width: var(--expressa-size-checkbox);
  height: var(--expressa-size-checkbox);
  border: var(--expressa-border-width-strong) solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: admin-combobox-spin 700ms linear infinite;
}
@keyframes admin-combobox-spin {
  to {
    transform: rotate(360deg);
  }
}
.admin-combobox__input:disabled {
  cursor: not-allowed;
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
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
  border-radius: var(--expressa-radius-md);
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
.admin-combobox__state {
  margin: 0;
  padding: var(--expressa-space-control-inline);
  color: var(--expressa-color-text-secondary);
}
</style>
