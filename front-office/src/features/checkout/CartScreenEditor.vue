<template>
  <section v-if="preparing" class="cart-editor-state" role="status">
    Обновляем товар
  </section>
  <section v-else-if="menuStore.status === 'error'" class="cart-editor-error">
    <button
      type="button"
      class="cart-editor-error__back"
      @click="emit('cancel')"
    >
      <ArrowLeft :size="20" aria-hidden="true" /> В корзину
    </button>
    <h1 class="cart-editor-error__title">Напиток</h1>
    <div class="cart-editor-error__surface" role="alert">
      <p>Не удалось загрузить напиток</p>
      <UiIconBtn
        class="cart-editor-error__retry"
        aria-label="Загрузить напиток ещё раз"
        @click="loadProduct"
      >
        <RefreshCw :size="20" aria-hidden="true" />
      </UiIconBtn>
    </div>
  </section>
  <ProductDetailScreen
    v-else-if="editableProduct"
    :category="editableProduct.category"
    :product="editableProduct.product"
    :cart-item="props.item"
    @back="emit('cancel')"
    @submit="emit('save', $event)"
  />
  <section v-else class="cart-editor-state" role="status">
    <p>Этот товар сейчас недоступен.</p>
    <UiBtn type="button" @click="emit('cancel')">Вернуться в корзину</UiBtn>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from "vue";
import { ArrowLeft, RefreshCw } from "lucide-vue-next";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import ProductDetailScreen from "@/features/menu/ProductDetailScreen.vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import type {
  CartScreenEditorEmits,
  CartScreenEditorProps,
} from "./CartScreenEditor.types";

const props = defineProps<CartScreenEditorProps>();
const emit = defineEmits<CartScreenEditorEmits>();
const menuStore = useMenuStore();
const preparing = shallowRef(true);

const editableProduct = computed(() => {
  for (const category of menuStore.menu?.categories ?? []) {
    const product = category.products.find(
      (candidate) => candidate.id === props.item.productId,
    );

    if (product?.isAvailable) {
      return { category, product };
    }
  }

  return null;
});

onMounted(() => {
  void loadProduct();
});

async function loadProduct(): Promise<void> {
  preparing.value = true;
  await menuStore.load(true);
  preparing.value = false;
}
</script>

<style scoped>
.cart-editor-state {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: var(--customer-space-7);
  padding: var(--customer-space-13) var(--customer-space-9);
  color: var(--customer-text);
}

.cart-editor-state p {
  margin: 0;
}

.cart-editor-state .ui-btn {
  padding: 0 var(--customer-space-8);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-sm);
}

.cart-editor-error {
  display: grid;
  align-content: start;
  gap: var(--customer-space-9);
  width: 100%;
  max-width: 55rem; /* Accepted 880px task width; no existing token. */
  padding: var(--customer-space-9);
}
.cart-editor-error__back {
  display: flex;
  align-items: center;
  justify-self: start;
  gap: var(--customer-space-5);
  min-height: calc(var(--customer-space-12) * 2);
  color: var(--customer-text);
  background: transparent;
  border: 0;
  font: inherit;
  font-weight: var(--customer-font-weight-bold);
  cursor: pointer;
}
.cart-editor-error__title {
  margin: 0;
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
}
.cart-editor-error__surface {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-9);
  padding: var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-xl);
}
.cart-editor-error__surface p {
  margin: 0;
  overflow-wrap: anywhere;
}
.cart-editor-error__retry {
  flex: 0 0 calc(var(--customer-space-12) * 2);
  width: calc(var(--customer-space-12) * 2);
  height: calc(var(--customer-space-12) * 2);
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
}
.cart-editor-error__retry:hover:not(:disabled) {
  background: var(--customer-surface-info);
}
@media (min-width: 1024px) {
  .cart-editor-error {
    padding: var(--customer-space-17) 0;
  }
  .cart-editor-error__surface {
    padding: var(--customer-space-13);
  }
}
</style>
