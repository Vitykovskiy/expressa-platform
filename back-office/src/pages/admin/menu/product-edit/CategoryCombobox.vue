<template>
  <div class="category-combobox">
    <input
      :id="inputId"
      ref="input"
      v-model="query"
      :aria-activedescendant="activeId"
      :aria-controls="listboxId"
      :aria-expanded="open"
      :disabled="props.disabled || props.loading"
      :placeholder="props.placeholder"
      aria-autocomplete="list"
      :aria-label="props.label"
      role="combobox"
      @focus="openList"
      @keydown="onKeydown"
    />
    <div
      v-if="open"
      :id="listboxId"
      class="category-combobox__menu"
      role="listbox"
      :aria-label="props.label"
    >
      <p v-if="props.loading" class="category-combobox__state" role="status">
        Загружаем категории…
      </p>
      <template v-else-if="props.error"
        ><p class="category-combobox__state" role="alert">
          Не удалось загрузить категории.
        </p>
        <button type="button" @mousedown.prevent @click="emit('retry')">
          Повторить
        </button></template
      >
      <p v-else-if="matches.length === 0" class="category-combobox__state">
        Категории не найдены.
      </p>
      <button
        v-for="(category, index) in matches"
        v-else
        :id="optionId(index)"
        :key="category.id"
        class="category-combobox__option"
        :class="{ 'category-combobox__option--active': index === activeIndex }"
        :aria-selected="category.id === props.modelValue"
        role="option"
        type="button"
        @mousedown.prevent="select(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";
import type { Category } from "../catalog.types";
const props = withDefaults(
  defineProps<{
    categories: readonly Category[];
    disabled?: boolean;
    error?: boolean;
    label?: string;
    loading?: boolean;
    modelValue: string;
    placeholder?: string;
  }>(),
  {
    disabled: false,
    error: false,
    label: "Категория",
    loading: false,
    placeholder: "Выберите категорию",
  },
);
const emit = defineEmits<{ "update:modelValue": [value: string]; retry: [] }>();
const id = useId();
const inputId = `category-combobox-${id}`;
const listboxId = `category-combobox-listbox-${id}`;
const input = useTemplateRef<HTMLInputElement>("input");
const open = shallowRef(false);
const query = shallowRef("");
const activeIndex = shallowRef(-1);
const selectedName = computed(
  () =>
    props.categories.find((item) => item.id === props.modelValue)?.name ?? "",
);
const matches = computed(() =>
  props.categories
    .filter((item) =>
      item.name
        .toLocaleLowerCase("ru")
        .includes(query.value.toLocaleLowerCase("ru")),
    )
    .slice(0, 50),
);
const activeId = computed(() =>
  activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
);
function optionId(index: number): string {
  return `category-combobox-option-${id}-${index}`;
}
function openList(): void {
  open.value = true;
  activeIndex.value = matches.value.findIndex(
    (item) => item.id === props.modelValue,
  );
}
function select(categoryId: string): void {
  emit("update:modelValue", categoryId);
  query.value =
    props.categories.find((item) => item.id === categoryId)?.name ?? "";
  open.value = false;
  activeIndex.value = -1;
  input.value?.focus();
}
function onKeydown(event: KeyboardEvent): void {
  if (props.loading || props.error) {
    if (event.key === "Escape") open.value = false;
    return;
  }
  const total = matches.value.length;
  if (event.key === "Escape") {
    open.value = false;
    query.value = selectedName.value;
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
    query.value = selectedName.value;
  },
  { immediate: true },
);
</script>
<style scoped>
.category-combobox {
  position: relative;
}
.category-combobox input {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.category-combobox__menu {
  position: absolute;
  z-index: 2;
  width: 100%;
  max-height: 240px;
  margin-top: 4px;
  overflow: auto;
  border: 1px solid var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
}
.category-combobox__option {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
}
.category-combobox__option--active,
.category-combobox__option:hover {
  background: var(--expressa-color-control-hover-surface);
}
.category-combobox__state {
  margin: 0;
  padding: 12px;
  color: var(--expressa-color-text-secondary);
}
</style>
