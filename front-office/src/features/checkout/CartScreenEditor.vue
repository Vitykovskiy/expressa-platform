<template>
  <section v-if="preparing" class="cart-editor-state" role="status">
    Обновляем товар
  </section>
  <section
    v-else-if="menuStore.status === 'error'"
    class="cart-editor-state"
    role="alert"
  >
    <p>Не удалось загрузить товар.</p>
    <UiBtn type="button" @click="loadProduct">Повторить</UiBtn>
    <UiBtn type="button" @click="emit('cancel')">Вернуться в корзину</UiBtn>
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
</style>
