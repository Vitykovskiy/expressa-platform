<template>
  <article class="price-choice-row">
    <button
      class="price-choice-row__summary"
      type="button"
      @click="emit('toggle')"
    >
      <span class="price-choice-row__summary-copy">
        <strong>{{ choice.portionLabel || "Без подписи" }}</strong>
        <span class="price-choice-row__price">{{ choice.price || "—" }} ₽</span>
      </span>
      <span class="price-choice-row__availability">{{
        choice.isAvailable ? "Доступен" : "Недоступен"
      }}</span>
    </button>
    <div v-if="expanded" class="price-choice-row__editor">
      <AdminFieldWrapper
        :id="priceId"
        v-slot="field"
        :error="errors?.price"
        label="Цена, ₽"
        required
      >
        <AdminTextField
          :id="field.controlId"
          :model-value="choice.price"
          :disabled="disabled"
          inputmode="numeric"
          :required="field.required"
          type="number"
          @update:model-value="emit('update:price', $event)"
        />
      </AdminFieldWrapper>
      <AdminFieldWrapper
        :id="portionLabelId"
        v-slot="field"
        :error="errors?.portionLabel"
        label="Порция или размер"
      >
        <AdminTextField
          :id="field.controlId"
          :model-value="choice.portionLabel"
          :disabled="disabled"
          :required="field.required"
          @update:model-value="emit('update:portionLabel', $event)"
        />
      </AdminFieldWrapper>
      <AdminFieldWrapper
        :id="availabilityId"
        v-slot="field"
        label="Доступен для заказа"
        layout="row"
      >
        <AdminToggle
          :id="field.controlId"
          :model-value="choice.isAvailable"
          :disabled="disabled"
          @update:model-value="emit('update:isAvailable', $event === true)"
        />
      </AdminFieldWrapper>
      <AdminActionGroup>
        <AdminButton
          type="button"
          variant="ghost"
          :disabled="disabled || first"
          @click="emit('move', -1)"
          >Выше</AdminButton
        ><AdminButton
          type="button"
          variant="ghost"
          :disabled="disabled || last"
          @click="emit('move', 1)"
          >Ниже</AdminButton
        ><AdminButton
          type="button"
          variant="ghost"
          :disabled="disabled"
          @click="emit('remove')"
          >Удалить цену</AdminButton
        >
      </AdminActionGroup>
    </div>
  </article>
</template>
<script setup lang="ts">
import { useId } from "vue";
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminFieldWrapper from "../../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import type { ProductPriceChoiceDraft } from "./useProductDraft.types";
defineProps<{
  choice: ProductPriceChoiceDraft;
  disabled?: boolean;
  expanded: boolean;
  first: boolean;
  errors?: { price?: string; portionLabel?: string };
  last: boolean;
}>();
const priceId = `price-choice-price-${useId()}`;
const portionLabelId = `price-choice-portion-${useId()}`;
const availabilityId = `price-choice-availability-${useId()}`;
const emit = defineEmits<{
  move: [offset: -1 | 1];
  remove: [];
  toggle: [];
  "update:price": [value: string];
  "update:portionLabel": [value: string];
  "update:isAvailable": [value: boolean];
}>();
</script>
<style scoped lang="scss">
.price-choice-row {
  min-width: 0;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
  overflow: hidden;
}
.price-choice-row__summary {
  display: flex;
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-8) var(--expressa-space-16);
  border: 0;
  background: var(--expressa-color-surface);
  color: var(--expressa-color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.price-choice-row__summary:hover,
.price-choice-row__summary:focus-visible {
  background: var(--expressa-color-control-hover-surface);
}
.price-choice-row__summary-copy {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
  gap: var(--expressa-space-8);
}
.price-choice-row__summary-copy strong {
  overflow-wrap: anywhere;
}
.price-choice-row__price,
.price-choice-row__availability {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
}
.price-choice-row__availability {
  flex: none;
}
.price-choice-row__editor {
  display: grid;
  gap: var(--expressa-space-16);
  padding: var(--expressa-space-16);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
@media (max-width: 599px) {
  .price-choice-row__summary {
    align-items: center;
  }
}
</style>
