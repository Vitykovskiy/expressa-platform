<template>
  <menu-root-screen
    v-if="screen.id === 'root'"
    :categories="menu.categories"
    :feedback="catalogFeedback"
    @select-category="openCategory"
  />
  <template v-else-if="screen.id === 'category'">
    <menu-group-screen
      :category="selectedCategory"
      :feedback="catalogFeedback"
      @return-to-menu="openRoot"
      @select-product="openProduct(selectedCategory?.id, $event)"
    />
  </template>
  <template v-else>
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
const recentlyAddedProductName = ref<string | null>(null);
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let lastConsumedMenuShellCommandId = 0;
watch(
  screen,
  (value) => {
    const nextScreen = cloneScreen(value);
    emit("changeLevel", nextScreen.id);
    emit("menuScreenChange", nextScreen);
  },
  { immediate: true },
);
watch(
  () => props.menuShellCommand,
  (command) => consumeMenuShellCommand(command),
);
onMounted(() => {
  const restoredScreen = getValidHistoryScreen(history.state?.menuFlowScreen);
  if (restoredScreen !== undefined) screen.value = restoredScreen;
  history.replaceState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
  window.addEventListener("popstate", restoreHistoryScreen);
  consumeMenuShellCommand(props.menuShellCommand);
});
onBeforeUnmount(() =>
  window.removeEventListener("popstate", restoreHistoryScreen),
);
onBeforeUnmount(() => clearTimeout(feedbackTimer));
const catalogFeedback = computed(() =>
  recentlyAddedProductName.value === null
    ? null
    : `Добавлено в корзину: ${recentlyAddedProductName.value}`,
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
  const focusedElement = getFocusedElement();
  clearFeedback();
  screen.value = { id: "category", categoryId };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
  focusHeadingAfterRemovedControl(
    focusedElement,
    focusedElement?.classList.contains("menu-root__category-card") ?? false,
  );
}

function consumeMenuShellCommand(
  command: MenuFlowProps["menuShellCommand"],
): void {
  if (!isMenuShellCommand(command)) return;
  if (command.requestId <= lastConsumedMenuShellCommandId) return;

  lastConsumedMenuShellCommandId = command.requestId;
  if (command.target.id === "root") {
    if (screen.value.id !== "root") openRoot();
    emit("menuShellCommandAck", command.requestId);
    return;
  }

  const categoryId = command.target.categoryId;
  if (
    props.menu.categories.some((category) => category.id === categoryId) &&
    !(screen.value.id === "category" && screen.value.categoryId === categoryId)
  ) {
    openCategory(categoryId);
  }

  emit("menuShellCommandAck", command.requestId);
}

function isMenuShellCommand(
  value: MenuFlowProps["menuShellCommand"],
): value is NonNullable<MenuFlowProps["menuShellCommand"]> {
  if (
    typeof value !== "object" ||
    value === null ||
    !Number.isSafeInteger(value.requestId) ||
    value.requestId <= 0 ||
    typeof value.target !== "object" ||
    value.target === null
  )
    return false;

  return (
    value.target.id === "root" ||
    (value.target.id === "category" &&
      typeof value.target.categoryId === "string")
  );
}
function openRoot(): void {
  if (screen.value.id === "root") return;
  const focusedElement = getFocusedElement();
  clearFeedback();
  screen.value = { id: "root" };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
  focusHeadingAfterRemovedControl(
    focusedElement,
    focusedElement?.classList.contains("customer-shell__desktop-back") ?? false,
  );
}
function openProduct(categoryId: string | undefined, productId: string): void {
  const category = props.menu.categories.find((item) => item.id === categoryId);
  if (!category?.products.some((product) => product.id === productId)) return;
  clearFeedback();
  productScrollY.value = window.scrollY;
  screen.value = {
    id: "product",
    categoryId: category.id,
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
  const focusedElement = getFocusedElement();
  clearFeedback();
  screen.value = nextScreen ?? { id: "root" };
  focusHeadingAfterRemovedControl(focusedElement);
  if (previousScreen.id === "product" && screen.value.id === "category") {
    void nextTick(() => window.scrollTo({ top: productScrollY.value }));
  }
}
function getFocusedElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}
function focusHeadingAfterRemovedControl(
  focusedElement: HTMLElement | null,
  force = false,
): void {
  void nextTick(() => {
    if (!force && focusedElement?.isConnected) return;
    const currentScreen = screen.value;
    const headingId =
      currentScreen.id === "root"
        ? "menu-root-title"
        : currentScreen.id === "category"
          ? `menu-group-${currentScreen.categoryId}`
          : undefined;
    if (headingId) document.getElementById(headingId)?.focus();
  });
}
function closeProduct(): void {
  if (screen.value.id !== "product") return;
  const focusedElement = getFocusedElement();
  screen.value = { id: "category", categoryId: screen.value.categoryId };
  history.pushState(
    { ...history.state, menuFlowScreen: toHistoryScreen(screen.value) },
    "",
  );
  focusHeadingAfterRemovedControl(focusedElement, true);
  void nextTick(() => window.scrollTo({ top: productScrollY.value }));
}
function toHistoryScreen(value: MenuFlowScreen): MenuFlowScreen {
  return cloneScreen(value);
}
function cloneScreen(value: MenuFlowScreen): MenuFlowScreen {
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
  showFeedback(item.productName);
  closeProduct();
}
function showFeedback(productName: string): void {
  clearTimeout(feedbackTimer);
  recentlyAddedProductName.value = null;
  void nextTick(() => {
    recentlyAddedProductName.value = productName;
    feedbackTimer = setTimeout(clearFeedback, 5000);
  });
}
function clearFeedback(): void {
  clearTimeout(feedbackTimer);
  feedbackTimer = undefined;
  recentlyAddedProductName.value = null;
}
</script>
