<template>
  <UiDialog
    :open="open"
    title="Архивировать товар?"
    :dismissible="!sending"
    @update:open="emit('close')"
  >
    <div class="product-archive">
      <p>{{ product?.name }} · {{ categoryName }}</p>
      <p>
        Товар и его ценовые опции перестанут отображаться в текущем каталоге.
      </p>
      <ul v-if="product?.priceChoices.length">
        <li v-for="choice in product.priceChoices" :key="choice.id">
          {{ choice.portionLabel }}
        </li>
      </ul>
      <CategoryOperation
        v-if="operation"
        :operation="operation"
        :disabled="disabled"
        @reconcile="emit('reconcile')"
        @refresh="emit('refresh')"
        @leave="emit('leave')"
      />
    </div>
    <template #actions>
      <UiButton
        variant="secondary"
        :disabled="sending"
        @activate="emit('close')"
        >Отменить</UiButton
      >
      <UiButton
        v-if="canConfirm"
        variant="danger"
        :disabled="confirmDisabled || checking"
        :loading="sending"
        @activate="emit('confirm')"
        >Архивировать товар</UiButton
      >
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import UiDialog from "../../shared/ui/UiDialog/UiDialog.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import CategoryOperation from "../category-edit/CategoryOperation.vue";
import type {
  ProductArchiveProps,
  ProductArchiveEmits,
} from "./ProductArchive.types";

const props = defineProps<ProductArchiveProps>();
const emit = defineEmits<ProductArchiveEmits>();
const sending = computed(() => props.operation?.status === "sending");
const checking = computed(() => props.operation?.status === "checking");
const canConfirm = computed(
  () => props.operation === null || checking.value || sending.value,
);

watch(
  () => props.operation?.status,
  (status) => {
    if (status !== "checking" && status !== "sending") return;

    const surface = document.activeElement?.closest(".ui-dialog");

    if (surface instanceof HTMLElement) surface.focus();
  },
  { flush: "sync" },
);
</script>

<style scoped>
.product-archive {
  display: grid;
  gap: var(--space-lg);
  overflow-wrap: anywhere;
}
.product-archive ul {
  padding-inline-start: var(--space-lg);
  margin: 0;
}
</style>
