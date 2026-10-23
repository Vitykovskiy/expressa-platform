<template>
  <div ref="root" class="group-option">
    <div class="group-option__fields">
      <OperationsInput
        label="Название опции"
        :model-value="props.option.name"
        :disabled="props.pending"
        required
        autocomplete="off"
        @update:model-value="update('name', $event)"
      />
      <OperationsInput
        label="Цена, ₽"
        :model-value="props.option.price"
        :disabled="props.pending"
        required
        inputmode="numeric"
        @update:model-value="update('price', $event)"
      />
    </div>
    <div class="group-option__actions">
      <label class="group-option__default"
        ><input
          type="checkbox"
          :aria-label="defaultLabel"
          :checked="props.option.isDefault"
          :disabled="defaultDisabled"
          @change="emit('selectDefault')"
        /><span>По умолчанию</span></label
      >
      <button
        type="button"
        class="group-option__remove"
        :disabled="props.pending"
        :aria-label="removeLabel"
        @click="emit('remove')"
      >
        Удалить
      </button>
    </div>
    <p v-if="unavailable" class="group-option__hint">
      Опция выключена в разделе «Доступность»
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from "vue";
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import { parseCatalogMoney } from "../catalog-pricing";
import type {
  CatalogGroupOptionDraft,
  CatalogGroupOptionRowProps,
  CatalogGroupOptionRowEmits,
} from "./CatalogEditor.types";

const props = defineProps<CatalogGroupOptionRowProps>();
const emit = defineEmits<CatalogGroupOptionRowEmits>();
const root = useTemplateRef<globalThis.HTMLDivElement>("root");
const defaultDisabled = computed(
  () =>
    props.pending ||
    (!props.option.isDefault &&
      (parseCatalogMoney(props.option.price.trim()) !== 0 ||
        !props.option.isAvailable)),
);
const removeLabel = computed(() =>
  props.option.name.trim() === ""
    ? "Удалить опцию"
    : `Удалить опцию «${props.option.name}»`,
);
const defaultLabel = computed(() =>
  props.option.name.trim() === ""
    ? "Выбирать опцию по умолчанию"
    : `Выбирать «${props.option.name}» по умолчанию`,
);
const unavailable = computed(() => !props.option.isAvailable);

function update<Key extends keyof CatalogGroupOptionDraft>(
  key: Key,
  value: CatalogGroupOptionDraft[Key],
) {
  if (!props.pending) {
    emit("change", { ...props.option, [key]: value });
  }
}

onMounted(async () => {
  if (props.focus) {
    await nextTick();
    root.value?.querySelector("input")?.focus();
  }
});
</script>

<style scoped>
.group-option {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  display: grid;
  gap: 8px;
}
.group-option__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
}
.group-option__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.group-option__default {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 13px;
  cursor: pointer;
}
.group-option__default input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}
.group-option__remove {
  min-height: 44px;
  padding: 8px;
  border: 0;
  background: transparent;
  color: var(--color-danger);
  font-size: 13px;
  cursor: pointer;
}
.group-option__remove:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.group-option__remove:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
.group-option__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-foreground-muted);
}
@media (max-width: 479px) {
  .group-option__fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
