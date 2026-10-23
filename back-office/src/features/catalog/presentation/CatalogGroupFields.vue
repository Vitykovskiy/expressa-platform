<template>
  <section class="group-fields" aria-label="Правила выбора и опции">
    <OperationsInput
      label="Выбор опций"
      type="select"
      :model-value="props.draft.selectionType"
      :options="CATALOG_GROUP_SELECTION_OPTIONS"
      :disabled="props.pending"
      @update:model-value="changeSelection"
    />
    <label v-if="single" class="group-fields__required"
      ><input
        type="checkbox"
        :checked="required"
        :disabled="props.pending"
        @change="toggleRequired"
      /><span>Обязательный выбор</span></label
    >
    <div v-else class="group-fields__limits">
      <OperationsInput
        label="Минимум опций"
        inputmode="numeric"
        :model-value="props.draft.minSelect"
        :disabled="props.pending"
        @update:model-value="update('minSelect', $event)"
      />
      <OperationsInput
        label="Максимум опций"
        inputmode="numeric"
        :model-value="props.draft.maxSelect"
        :disabled="props.pending"
        @update:model-value="update('maxSelect', $event)"
      />
    </div>
    <div class="group-fields__options">
      <h3>Опции</h3>
      <CatalogGroupOptionRow
        v-for="option in props.draft.options"
        :key="option.key"
        :option="option"
        :pending="props.pending"
        :focus="option.key === props.focusOptionKey"
        @change="changeOption"
        @select-default="selectDefault(option.key)"
        @remove="removeOption(option.key)"
      />
      <OperationsButton
        label="Добавить опцию"
        kind="secondary"
        :disabled="props.pending"
        @click="addOption"
      />
    </div>
    <p v-if="validation" class="group-fields__error" role="status">
      {{ validation }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import CatalogGroupOptionRow from "./CatalogGroupOptionRow.vue";
import { groupDraftError } from "../catalog-group-draft";
import { CATALOG_GROUP_SELECTION_OPTIONS } from "./CatalogEditor.constants";
import type {
  CatalogGroupDraft,
  CatalogGroupOptionDraft,
  CatalogGroupFieldsProps,
  CatalogGroupFieldsEmits,
} from "./CatalogEditor.types";

const props = defineProps<CatalogGroupFieldsProps>();
const emit = defineEmits<CatalogGroupFieldsEmits>();
const single = computed(() => props.draft.selectionType === "single");
const required = computed(() => props.draft.minSelect === "1");
const validation = computed(() => groupDraftError(props.draft));

function update<Key extends keyof CatalogGroupDraft>(
  key: Key,
  value: CatalogGroupDraft[Key],
) {
  if (!props.pending) {
    emit("update:draft", { ...props.draft, [key]: value });
  }
}

function changeSelection(value: string) {
  if (props.pending || (value !== "single" && value !== "multiple")) {
    return;
  }

  emit("update:draft", {
    ...props.draft,
    selectionType: value,
    minSelect: "0",
    maxSelect:
      value === "single"
        ? "1"
        : String(Math.max(1, props.draft.options.length)),
  });
}

function toggleRequired() {
  update("minSelect", required.value ? "0" : "1");
}

function changeOption(option: CatalogGroupOptionDraft) {
  update(
    "options",
    props.draft.options.map((current) =>
      current.key === option.key ? option : current,
    ),
  );
}

function selectDefault(key: string) {
  const selected = props.draft.options.find((option) => option.key === key);

  if (selected === undefined) {
    return;
  }

  update(
    "options",
    props.draft.options.map((option) => {
      if (option.key === key) {
        return { ...option, isDefault: !selected.isDefault };
      }

      if (single.value) {
        return { ...option, isDefault: false };
      }

      return option;
    }),
  );
}

function removeOption(key: string) {
  update(
    "options",
    props.draft.options.filter((option) => option.key !== key),
  );
}

function addOption() {
  update("options", [
    ...props.draft.options,
    {
      key: globalThis.crypto.randomUUID(),
      id: null,
      name: "",
      price: "0",
      sortOrder: props.draft.options.reduce(
        (order, option) => Math.max(order, option.sortOrder + 1),
        0,
      ),
      isDefault: false,
      isAvailable: true,
    },
  ]);
}
</script>

<style scoped>
.group-fields,
.group-fields__options {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.group-fields :deep(.operations-button) {
  min-height: 44px;
}
.group-fields__options h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.group-fields__limits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.group-fields__required {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 14px;
  cursor: pointer;
}
.group-fields__required input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}
.group-fields__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 20px;
}
</style>
