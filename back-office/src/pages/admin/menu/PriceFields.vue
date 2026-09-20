<template>
  <div class="price-fields">
    <label :for="priceId" class="price-fields__label">Цена, ₽</label>
    <AdminTextField
      :id="priceId"
      v-model="price"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="Boolean(error)"
      :disabled="props.disabled"
      inputmode="numeric"
      min="0"
      type="number"
    />

    <label :for="portionSelectId" class="price-fields__label">
      Порция или размер{{ props.requiredLabel ? "" : " (необязательно)" }}
    </label>
    <AdminSelect
      :id="portionSelectId"
      v-model="selectedPortionLabel"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="Boolean(error)"
      :disabled="props.disabled"
    >
      <option v-if="!props.requiredLabel" value="">Без подписи</option>
      <option v-else disabled value="">Выберите порцию или размер</option>
      <option
        v-for="suggestion in portionLabelSuggestions"
        :key="suggestion"
        :value="suggestion"
      >
        {{ suggestion }}
      </option>
      <option :value="customPortionLabelOption">
        {{ customPortionLabelOption }}
      </option>
    </AdminSelect>

    <template v-if="customPortionLabel">
      <label :for="customPortionLabelId" class="price-fields__label">
        Свой вариант
      </label>
      <AdminTextField
        :id="customPortionLabelId"
        v-model="portionLabel"
        :aria-describedby="error ? errorId : undefined"
        :aria-invalid="Boolean(error)"
        :disabled="props.disabled"
      />
    </template>

    <p v-if="error" :id="errorId" class="price-fields__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId } from "vue";

import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import {
  customPortionLabelOption,
  portionLabelSuggestions,
} from "./AddProductDialog.constants";
import type { PriceFieldsProps } from "./PriceFields.types";

const props = withDefaults(defineProps<PriceFieldsProps>(), {
  disabled: false,
  error: undefined,
  requiredLabel: false,
});
const price = defineModel<string>("price", { required: true });
const portionLabel = defineModel<string>("portionLabel", { required: true });
const customRequested = shallowRef(false);
const priceId = `price-field-${useId()}`;
const portionSelectId = `portion-select-${useId()}`;
const customPortionLabelId = `custom-portion-label-${useId()}`;
const errorId = `price-fields-error-${useId()}`;
const customPortionLabel = computed(
  () =>
    customRequested.value ||
    (portionLabel.value !== "" &&
      !portionLabelSuggestions.includes(
        portionLabel.value as (typeof portionLabelSuggestions)[number],
      )),
);
const selectedPortionLabel = computed({
  get: () =>
    customPortionLabel.value ? customPortionLabelOption : portionLabel.value,
  set: (value: string) => {
    customRequested.value = value === customPortionLabelOption;
    portionLabel.value = customRequested.value ? "" : value;
  },
});
</script>

<style scoped lang="scss">
.price-fields {
  display: grid;
  gap: var(--expressa-space-2xs);
}

.price-fields__label {
  font-weight: var(--expressa-font-weight-semibold);
}

.price-fields__error {
  margin: 0;
  color: var(--expressa-color-status-error);
}
</style>
