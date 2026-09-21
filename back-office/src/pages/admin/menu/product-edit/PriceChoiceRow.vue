<template>
  <article class="price-choice-row">
    <button
      class="price-choice-row__summary"
      type="button"
      :aria-expanded="expanded"
      @click="emit('toggle')"
    >
      <span
        ><strong>{{ choice.portionLabel || "Без подписи" }}</strong
        ><span>{{ choice.price || "—" }} ₽</span></span
      >
      <span>{{ choice.isAvailable ? "Доступен" : "Недоступен" }}</span>
    </button>
    <div v-if="expanded" class="price-choice-row__editor">
      <label
        >Цена, ₽<input
          :value="choice.price"
          inputmode="numeric"
          :disabled="disabled"
          :aria-invalid="Boolean(errors?.price)"
          @input="
            emit('update:price', ($event.target as HTMLInputElement).value)
          "
      /></label>
      <label
        >Порция или размер<input
          :value="choice.portionLabel"
          :disabled="disabled"
          :aria-invalid="Boolean(errors?.portionLabel)"
          @input="
            emit(
              'update:portionLabel',
              ($event.target as HTMLInputElement).value,
            )
          "
      /></label>
      <label
        >Доступен для заказа
        <AdminToggle
          :model-value="choice.isAvailable"
          :disabled="disabled"
          @update:model-value="emit('update:isAvailable', $event === true)"
      /></label>
      <p v-if="errors?.price" role="alert">{{ errors.price }}</p>
      <p v-if="errors?.portionLabel" role="alert">{{ errors.portionLabel }}</p>
      <div>
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
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
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
const emit = defineEmits<{
  move: [offset: -1 | 1];
  remove: [];
  toggle: [];
  "update:price": [value: string];
  "update:portionLabel": [value: string];
  "update:isAvailable": [value: boolean];
}>();
</script>
