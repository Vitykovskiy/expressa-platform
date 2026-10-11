<template>
  <div class="order-search">
    <form class="order-search__number" @submit.prevent="submit">
      <UiTextField
        :model-value="draft"
        label="Номер заказа"
        :error="error"
        :maxlength="orderNumberLimit"
        @update:model-value="edit"
      />
      <UiButton type="submit" variant="secondary">Найти</UiButton>
    </form>
    <UiSelect
      class="order-search__stage"
      :model-value="stageValue"
      label="Стадия"
      :options="stageOptions"
      @update:model-value="changeStage"
    />
    <UiButton
      class="order-search__refresh"
      variant="quiet"
      :loading="pending"
      :disabled="refreshDisabled"
      @activate="emit('refresh')"
      >Обновить</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiSelect from "../../shared/ui/UiSelect/UiSelect.vue";
import { orderNumberLimit } from "../../entities/order/order.constants";
import { isOrderStage } from "../../entities/order/order.validation";
import { stageOptions } from "./OrderSearch.constants";
import type { OrderSearchEmits, OrderSearchProps } from "./OrderSearch.types";

const props = defineProps<OrderSearchProps>();
const emit = defineEmits<OrderSearchEmits>();
const draft = ref(props.filters.number ?? "");
const error = ref("");
const stageValue = computed(() => props.filters.stage ?? "all");
const dirty = computed(() => draft.value !== (props.filters.number ?? ""));

watch(dirty, (value) => emit("dirty", value), {
  immediate: true,
  flush: "sync",
});

function edit(value: string) {
  draft.value = value;
  error.value = "";
}

function submit() {
  if (
    draft.value.length > orderNumberLimit ||
    (draft.value !== "" && draft.value.trim() === "")
  ) {
    error.value = "Введите номер до 64 символов";

    return;
  }

  emit("search", {
    number: draft.value === "" ? null : draft.value,
    stage: props.filters.stage,
  });
}

function changeStage(value: string | null) {
  if (value === "all" || isOrderStage(value)) {
    emit("search", {
      number: props.filters.number,
      stage: value === "all" ? null : value,
    });
  }
}

watch(
  () => props.filters.number,
  (value) => {
    draft.value = value ?? "";
    error.value = "";
  },
);
</script>

<style scoped>
.order-search {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-block-end: var(--space-xl);
}
.order-search__number {
  display: flex;
  flex: 1 1 18rem;
  align-items: end;
  gap: var(--space-sm);
  min-inline-size: 0;
}
.order-search__number > :first-child {
  flex: 1;
  min-inline-size: 0;
}
.order-search__stage {
  flex: 1 1 12rem;
}
.order-search__refresh {
  flex: 0 1 auto;
}
/* U02 toolbar boundary: narrow groups occupy their own line. */
@media (max-width: 37.499rem) {
  .order-search__number,
  .order-search__stage {
    flex-basis: 100%;
  }
}
</style>
