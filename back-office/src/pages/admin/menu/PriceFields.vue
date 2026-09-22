<template>
  <div class="price-fields">
    <AdminFieldWrapper
      :id="priceId"
      v-slot="field"
      :error="priceMessage"
      label="Цена, ₽"
      required
    >
      <AdminTextField
        :id="field.controlId"
        v-model="price"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid"
        :aria-required="field.required"
        :disabled="props.disabled"
        :required="field.required"
        inputmode="numeric"
        min="0"
        type="number"
        @blur="emit('blur:price')"
      />
    </AdminFieldWrapper>

    <AdminFieldWrapper
      :id="portionSelectId"
      v-slot="field"
      :error="customPortionLabel ? undefined : portionLabelMessage"
      label="Порция или размер"
      :required="props.requiredLabel"
    >
      <AdminSelect
        :id="field.controlId"
        v-model="selectedPortionLabel"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid"
        :aria-required="field.required"
        :disabled="props.disabled"
        :items="portionOptions"
        :placeholder="
          props.requiredLabel ? 'Выберите порцию или размер' : 'Без подписи'
        "
        :required="field.required"
        @blur="emit('blur:portion-label')"
      />
    </AdminFieldWrapper>

    <template v-if="customPortionLabel">
      <AdminFieldWrapper
        :id="customPortionLabelId"
        v-slot="field"
        :error="portionLabelMessage"
        label="Свой вариант"
        :required="props.requiredLabel"
      >
        <AdminTextField
          :id="field.controlId"
          v-model="portionLabel"
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          :disabled="props.disabled"
          :required="field.required"
          @blur="emit('blur:portion-label')"
        />
      </AdminFieldWrapper>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId } from "vue";

import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import {
  customPortionLabelOption,
  portionLabelSuggestions,
} from "./AddProductDialog.constants";
import type { PriceFieldsProps } from "./PriceFields.types";

const props = withDefaults(defineProps<PriceFieldsProps>(), {
  disabled: false,
  error: undefined,
  priceError: undefined,
  portionLabelError: undefined,
  requiredLabel: false,
});
const emit = defineEmits<{
  "blur:price": [];
  "blur:portion-label": [];
}>();
const price = defineModel<string>("price", { required: true });
const portionLabel = defineModel<string>("portionLabel", { required: true });
const customRequested = shallowRef(false);
const priceId = `price-field-${useId()}`;
const portionSelectId = `portion-select-${useId()}`;
const customPortionLabelId = `custom-portion-label-${useId()}`;
const priceMessage = computed(() => props.priceError ?? props.error);
const portionLabelMessage = computed(() => props.portionLabelError);
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
const portionOptions = computed(() => [
  ...(!props.requiredLabel ? [{ title: "Без подписи", value: "" }] : []),
  ...portionLabelSuggestions.map((value) => ({ title: value, value })),
  { title: customPortionLabelOption, value: customPortionLabelOption },
]);
</script>

<style scoped lang="scss">
.price-fields {
  display: grid;
  gap: var(--expressa-space-2xs);
}
</style>
