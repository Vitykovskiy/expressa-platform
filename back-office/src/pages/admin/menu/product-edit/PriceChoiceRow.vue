<template>
  <article class="price-choice-row">
    <header class="price-choice-row__summary">
      <div class="price-choice-row__summary-copy">
        <div class="price-choice-row__values">
          <strong>{{ choice.portionLabel || "Без подписи" }}</strong>
          <span class="price-choice-row__price"
            >{{ choice.price || "—" }} ₽</span
          >
        </div>
        <span class="price-choice-row__availability">{{
          choice.isAvailable ? "Доступен" : "Недоступен"
        }}</span>
      </div>
      <AdminButton
        size="compact"
        type="button"
        variant="ghost"
        @click="emit('toggle')"
      >
        <AdminIcon :icon="expanded ? ChevronUp : ChevronDown" />
      </AdminButton>
    </header>
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
        label="В продаже"
        layout="row"
      >
        <AdminToggle
          :id="field.controlId"
          :model-value="choice.isAvailable"
          :disabled="disabled"
          @update:model-value="emit('update:isAvailable', $event === true)"
        />
      </AdminFieldWrapper>
      <AdminActionGroup align="end" class="price-choice-row__actions">
        <AdminButton
          size="compact"
          type="button"
          variant="ghost"
          :disabled="disabled || first"
          @click="emit('move', -1)"
          ><AdminIcon :icon="ChevronUp" /></AdminButton
        ><AdminButton
          size="compact"
          type="button"
          variant="ghost"
          :disabled="disabled || last"
          @click="emit('move', 1)"
          ><AdminIcon :icon="ChevronDown" /></AdminButton
        ><AdminButton
          size="compact"
          type="button"
          variant="destructive"
          :disabled="disabled"
          @click="emit('remove')"
          ><AdminIcon :icon="Trash2"
        /></AdminButton>
      </AdminActionGroup>
    </div>
  </article>
</template>
<script setup lang="ts">
import { ChevronDown, ChevronUp, Trash2 } from "lucide-vue-next";
import { useId } from "vue";
import AdminIcon from "../../../../shared/ui/admin/admin-icon/AdminIcon.vue";
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--expressa-space-8);
  padding: var(--expressa-space-8) var(--expressa-space-16);
}
.price-choice-row__summary-copy {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-4);
}
.price-choice-row__values {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: baseline;
  gap: var(--expressa-space-8);
}
.price-choice-row__values strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-choice-row__price,
.price-choice-row__availability {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
}
.price-choice-row__price {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: end;
}
.price-choice-row__editor {
  display: grid;
  align-items: start;
  gap: var(--expressa-space-16);
  padding: var(--expressa-space-16);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.price-choice-row__actions {
  flex-wrap: nowrap;
}
@media (max-width: 599px) {
  .price-choice-row__values {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--expressa-space-4);
  }
  .price-choice-row__price {
    text-align: start;
  }
}
@media (min-width: 600px) {
  .price-choice-row__editor {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
  .price-choice-row__editor > :nth-child(n + 3) {
    grid-column: 1 / -1;
  }
}
</style>
