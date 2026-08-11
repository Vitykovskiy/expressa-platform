<template>
  <menu-root-screen
    v-if="screen.id === 'root'"
    :categories="menu.categories"
    @select-category="openCategory"
  />
  <template v-else-if="screen.id === 'category'">
    <ui-btn
      v-if="selectedCategory?.products.length !== 0"
      type="button"
      variant="text"
      class="menu-flow__back"
      @click="openRoot"
      >Назад</ui-btn
    >
    <menu-group-screen
      :category="selectedCategory"
      @return-to-menu="openRoot"
      @select-product="openProduct"
    />
  </template>
  <template v-else>
    <ui-btn
      type="button"
      variant="text"
      class="menu-flow__back"
      @click="closeProduct"
      >Назад</ui-btn
    >
    <product-detail-screen
      v-if="selectedCategory && selectedProduct"
      :category="selectedCategory"
      :product="selectedProduct"
      @submit="addConfigured"
    />
  </template>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import MenuGroupScreen from "./MenuGroupScreen.vue";
import MenuRootScreen from "./MenuRootScreen.vue";
import ProductDetailScreen from "./ProductDetailScreen.vue";
import type { ConfiguredCartItemDraft } from "@/entities/customer/model/customer.types";
import type {
  MenuFlowEmits,
  MenuFlowProps,
  MenuFlowScreen,
} from "./MenuFlow.types";

const props = defineProps<MenuFlowProps>();
const emit = defineEmits<MenuFlowEmits>();
const screen = ref<MenuFlowScreen>({ id: "root" });
const productScrollY = ref(0);
watch(screen, (value) => emit("changeLevel", value.id), { immediate: true });
onMounted(() => {
  history.replaceState(
    { ...history.state, menuFlowScreen: toHistoryScreen({ id: "root" }) },
    "",
  );
  window.addEventListener("popstate", restoreHistoryScreen);
});
onBeforeUnmount(() =>
  window.removeEventListener("popstate", restoreHistoryScreen),
);
const selectedCategory = computed(() => {
  const currentScreen = screen.value;
  if (currentScreen.id === "root") return undefined;
  return props.menu.categories.find(
    (category) => category.id === currentScreen.categoryId,
  );
});
const selectedProduct = computed(() => {
  const currentScreen = screen.value;
  if (currentScreen.id !== "product") return undefined;
  return selectedCategory.value?.products.find(
    (product) => product.id === currentScreen.productId,
  );
});

function openCategory(categoryId: string): void {
  screen.value = { id: "category", categoryId };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
}
function openRoot(): void {
  if (hasCurrentManagedEntry() && screen.value.id === "category") {
    history.back();
    return;
  }
  screen.value = { id: "root" };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
}
function openProduct(productId: string): void {
  if (screen.value.id !== "category") return;
  productScrollY.value = window.scrollY;
  screen.value = {
    id: "product",
    categoryId: screen.value.categoryId,
    productId,
  };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
}
function restoreHistoryScreen(event: PopStateEvent): void {
  if (!("menuFlowScreen" in (event.state ?? {}))) return;
  const nextScreen = getValidHistoryScreen(event.state.menuFlowScreen);
  const previousScreen = screen.value;
  screen.value = nextScreen ?? { id: "root" };
  if (previousScreen.id === "product" && screen.value.id === "category") {
    void nextTick(() => window.scrollTo({ top: productScrollY.value }));
  }
}
function closeProduct(): void {
  if (screen.value.id !== "product") return;
  if (hasCurrentManagedEntry()) {
    history.back();
    return;
  }
  screen.value = { id: "category", categoryId: screen.value.categoryId };
  void nextTick(() => window.scrollTo({ top: productScrollY.value }));
}
function hasCurrentManagedEntry(): boolean {
  const historyScreen = getValidHistoryScreen(history.state?.menuFlowScreen);
  return historyScreen?.id === screen.value.id;
}
function toHistoryScreen(value: MenuFlowScreen): MenuFlowScreen {
  if (value.id === "root") return { id: "root" };
  if (value.id === "category")
    return { id: "category", categoryId: value.categoryId };
  return {
    id: "product",
    categoryId: value.categoryId,
    productId: value.productId,
  };
}
function getValidHistoryScreen(value: unknown): MenuFlowScreen | undefined {
  if (typeof value !== "object" || value === null || !("id" in value))
    return undefined;
  const candidate = value as Record<string, unknown>;
  if (candidate.id === "root") return { id: "root" };
  if (
    candidate.id === "category" &&
    typeof candidate.categoryId === "string" &&
    props.menu.categories.some(
      (category) => category.id === candidate.categoryId,
    )
  )
    return { id: "category", categoryId: candidate.categoryId };
  if (
    candidate.id === "product" &&
    typeof candidate.categoryId === "string" &&
    typeof candidate.productId === "string"
  ) {
    const category = props.menu.categories.find(
      (item) => item.id === candidate.categoryId,
    );
    return category?.products.some(
      (product) => product.id === candidate.productId,
    )
      ? {
          id: "product",
          categoryId: candidate.categoryId,
          productId: candidate.productId,
        }
      : category
        ? { id: "category", categoryId: candidate.categoryId }
        : undefined;
  }
  return undefined;
}
function addConfigured(item: ConfiguredCartItemDraft): void {
  emit("add", item);
  closeProduct();
}
</script>

<style scoped lang="scss">
.menu-flow__back {
  margin: var(--customer-space-7) var(--customer-space-9) 0;
}
</style>
