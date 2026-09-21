<template>
  <section class="menu-reorder" aria-labelledby="menu-reorder-title">
    <div class="menu-reorder__bar">
      <div>
        <h2 id="menu-reorder-title" ref="title" tabindex="-1">
          Настройка порядка
        </h2>
        <p>Перетащите категории или используйте кнопки перемещения.</p>
        <p v-if="props.pending" class="menu-reorder__status" role="status">
          Сохраняем…
        </p>
        <p
          v-else-if="dirtyScopes.length"
          class="menu-reorder__status"
          role="status"
        >
          Есть несохранённые изменения
        </p>
      </div>
      <div class="menu-reorder__actions">
        <AdminButton
          type="button"
          variant="secondary"
          :disabled="props.pending"
          @click="requestClose"
          >Отмена</AdminButton
        ><AdminButton
          type="button"
          :disabled="props.pending || dirtyScopes.length === 0"
          @click="emit('save', dirtyScopes)"
          >{{ props.pending ? "Сохраняем…" : "Сохранить порядок" }}</AdminButton
        >
      </div>
    </div>
    <p
      v-if="props.error"
      class="menu-reorder__error"
      role="alert"
      tabindex="-1"
    >
      {{ props.error }}
    </p>
    <p class="menu-reorder__hint" aria-live="polite">{{ announcement }}</p>
    <ConfirmDialog
      v-model:open="discardOpen"
      cancel-label="Продолжить"
      confirm-label="Отменить изменения"
      confirm-variant="destructive"
      description="Несохранённый порядок будет потерян."
      title="Отменить изменения порядка?"
      @cancel="cancelDiscard"
      @confirm="confirmDiscard"
    />
    <div
      ref="categoryList"
      class="menu-reorder__list"
      role="list"
      :aria-busy="props.pending"
      @scroll="onCategoryScroll"
    >
      <div
        class="menu-reorder__category-spacer"
        :style="{ height: `${categoryVirtual.beforeSize.value}px` }"
        aria-hidden="true"
      />
      <section
        v-for="(categoryId, index) in visibleCategoryIds"
        :key="categoryId"
        class="menu-reorder__subtree"
        role="listitem"
        :aria-posinset="categoryStart + index + 1"
        :aria-setsize="draft.categoryIds.length"
      >
        <MenuReorderRow
          :id="categoryId"
          entity-type="category"
          :label="categoryName(categoryId)"
          :can-move-up="categoryStart + index > 0"
          :can-move-down="categoryStart + index < draft.categoryIds.length - 1"
          :position="categoryStart + index + 1"
          :total="draft.categoryIds.length"
          :disabled="props.pending"
          disclosable
          :expanded="isExpanded(categoryId)"
          @move="moveCategory(categoryId, $event)"
          @keyboard-drag-cancel="
            cancelKeyboardDrag(categoryName(categoryId), null, categoryId)
          "
          @keyboard-drag-start="startKeyboardDrag"
          @toggle="toggle(categoryId)"
        />
        <div
          v-if="isExpanded(categoryId)"
          :ref="(element) => setProductList(categoryId, element)"
          class="menu-reorder__products"
          role="list"
          :aria-label="`Товары категории ${categoryName(categoryId)}`"
          :style="{ blockSize: `${productPanelHeight(categoryId)}px` }"
          @scroll="onProductScroll(categoryId)"
        >
          <p
            v-if="productIds(categoryId).length === 0"
            class="menu-reorder__empty-products"
            role="status"
          >
            Товаров в этой категории пока нет
          </p>
          <div
            v-if="productIds(categoryId).length > 0"
            class="menu-reorder__product-spacer"
            :style="{
              height: `${productVirtual(categoryId).beforeSize.value}px`,
            }"
            aria-hidden="true"
          />
          <MenuReorderRow
            v-for="(productId, productIndex) in productIds(categoryId).length >
            0
              ? visibleProductIds(categoryId)
              : []"
            :id="productId"
            :key="productId"
            entity-type="product"
            :label="productName(productId)"
            :can-move-up="productStart(categoryId) + productIndex > 0"
            :can-move-down="
              productStart(categoryId) + productIndex <
              productIds(categoryId).length - 1
            "
            :disabled="props.pending"
            :position="productStart(categoryId) + productIndex + 1"
            :total="productIds(categoryId).length"
            role="listitem"
            :aria-posinset="productStart(categoryId) + productIndex + 1"
            :aria-setsize="productIds(categoryId).length"
            @move="moveProduct(categoryId, productId, $event)"
            @keyboard-drag-cancel="
              cancelKeyboardDrag(productName(productId), categoryId, productId)
            "
            @keyboard-drag-start="startKeyboardDrag"
          />
          <div
            v-if="productIds(categoryId).length > 0"
            class="menu-reorder__product-spacer"
            :style="{
              height: `${productVirtual(categoryId).afterSize.value}px`,
            }"
            aria-hidden="true"
          />
        </div>
      </section>
      <div
        class="menu-reorder__category-spacer"
        :style="{
          height: `${categoryVirtual.afterSize.value}px`,
        }"
        aria-hidden="true"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  watch,
} from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from "vue-router";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { useMenuReorderDraft } from "./composables/useMenuReorderDraft";
import type {
  MenuReorderPanelEmits,
  MenuReorderPanelProps,
} from "./MenuReorderPanel.types";
import type { MenuReorderDraft } from "./composables/useMenuReorderDraft.types";
import MenuReorderRow from "./MenuReorderRow.vue";
import { useVirtualSiblingRows } from "./composables/useVirtualSiblingRows";
import { menuReorderGeometry } from "./MenuReorderPanel.constants";
const props = withDefaults(defineProps<MenuReorderPanelProps>(), {
  pending: false,
  error: null,
});
const emit = defineEmits<MenuReorderPanelEmits>();
const router = useRouter();
const categories = toRef(props, "categories");
const products = toRef(props, "products");
const { draft, dirtyScopes, move, reset } = useMenuReorderDraft(
  categories,
  products,
);
const announcement = ref("");
const discardOpen = ref(false);
const closeRequested = ref(false);
const pendingNavigation = ref<string | null>(null);
const categoryList = ref<HTMLElement | null>(null);
const title = ref<HTMLElement | null>(null);
const keyboardDragSnapshot = ref<MenuReorderDraft | null>(null);
const categoryVirtual = useVirtualSiblingRows(
  () => draft.value.categoryIds.length,
  (index) => categorySubtreeHeight(draft.value.categoryIds[index] ?? ""),
  menuReorderGeometry.virtualizationThreshold,
  menuReorderGeometry.overscan,
);
const categoryStart = computed(() => categoryVirtual.start.value);
const visibleCategoryIds = computed(() =>
  draft.value.categoryIds.slice(
    categoryVirtual.start.value,
    categoryVirtual.end.value,
  ),
);
const productLists = new Map<string, HTMLElement>();
const productVirtuals = new Map<
  string,
  ReturnType<typeof useVirtualSiblingRows>
>();
function productIds(categoryId: string): readonly string[] {
  return draft.value.productIdsByCategory[categoryId] ?? [];
}
function productVirtual(
  categoryId: string,
): ReturnType<typeof useVirtualSiblingRows> {
  const known = productVirtuals.get(categoryId);
  if (known) return known;
  const created = useVirtualSiblingRows(
    () => productIds(categoryId).length,
    () => menuReorderGeometry.productRow,
    menuReorderGeometry.virtualizationThreshold,
    menuReorderGeometry.overscan,
  );
  productVirtuals.set(categoryId, created);
  return created;
}
function productStart(categoryId: string): number {
  return productVirtual(categoryId).start.value;
}
function productPanelHeight(categoryId: string): number {
  if (!isExpanded(categoryId)) return 0;
  const count = productIds(categoryId).length;
  return count === 0
    ? menuReorderGeometry.emptyProducts
    : Math.min(count, menuReorderGeometry.maxVisibleProducts) *
        menuReorderGeometry.productRow;
}
function categorySubtreeHeight(categoryId: string): number {
  return menuReorderGeometry.categoryRow + productPanelHeight(categoryId);
}
function visibleProductIds(categoryId: string): readonly string[] {
  const virtual = productVirtual(categoryId);
  return productIds(categoryId).slice(virtual.start.value, virtual.end.value);
}
function setProductList(categoryId: string, element: unknown): void {
  if (
    element instanceof HTMLElement &&
    productLists.get(categoryId) === element
  ) {
    syncProductViewport(categoryId, element);
    return;
  }

  if (!(element instanceof HTMLElement)) {
    productLists.delete(categoryId);
    return;
  }

  productLists.set(categoryId, element);
  syncProductViewport(categoryId, element);
}
watch(
  () => [props.categories, props.products] as const,
  () => {
    // A refresh after a failed transaction must not erase the user's local draft.
    if (draft.value.categoryIds.length === 0 || dirtyScopes.value.length === 0)
      reset();
  },
  { immediate: true },
);
const categoryById = computed(
  () => new Map(props.categories.map((item) => [item.id, item])),
);
const productById = computed(
  () => new Map(props.products.map((item) => [item.id, item])),
);
function categoryName(id: string): string {
  return categoryById.value.get(id)?.name ?? "Категория";
}
function productName(id: string): string {
  return productById.value.get(id)?.name ?? "Товар";
}
function isExpanded(id: string): boolean {
  return props.expandedCategoryIds.has(id);
}
function toggle(id: string): void {
  const next = new Set(props.expandedCategoryIds);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  emit("update:expandedCategoryIds", next);
}
function onCategoryScroll(): void {
  categoryVirtual.scrollTop.value = categoryList.value?.scrollTop ?? 0;
  categoryVirtual.viewportHeight.value = categoryList.value?.clientHeight ?? 0;
}
function onProductScroll(categoryId: string): void {
  const element = productLists.get(categoryId);
  if (element) syncProductViewport(categoryId, element);
}
function syncProductViewport(categoryId: string, element: HTMLElement): void {
  const virtual = productVirtual(categoryId);
  virtual.scrollTop.value = element.scrollTop;
  virtual.viewportHeight.value = element.clientHeight;
}
onMounted(() => {
  void nextTick(() => {
    onCategoryScroll();
    for (const [categoryId, element] of productLists)
      syncProductViewport(categoryId, element);
    focusTitle();
  });
});
async function moved(
  label: string,
  scope: string | null,
  id: string,
  offset: -1 | 1,
  control: "handle" | "up" | "down",
): Promise<void> {
  if (!move(scope, id, offset)) {
    announcement.value = `${label}: ${offset === -1 ? "уже первая" : "уже последняя"} позиция`;
    return;
  }
  const ids =
    scope === null
      ? draft.value.categoryIds
      : (draft.value.productIdsByCategory[scope] ?? []);
  announcement.value = `${label}: позиция ${ids.indexOf(id) + 1} из ${ids.length}`;
  const index = ids.indexOf(id);
  if (scope === null && categoryList.value) {
    categoryList.value.scrollTop = categoryVirtual.scrollTopForIndex(
      index,
      categoryList.value.scrollTop,
      categoryList.value.clientHeight,
    );
    onCategoryScroll();
  } else if (scope !== null) {
    const list = productLists.get(scope);
    if (list) {
      const virtual = productVirtual(scope);
      list.scrollTop = virtual.scrollTopForIndex(
        index,
        list.scrollTop,
        list.clientHeight,
      );
      syncProductViewport(scope, list);
    }
  }
  await nextTick();
  document
    .querySelector<HTMLElement>(`[data-reorder-control="${id}:${control}"]`)
    ?.focus();
}
function moveCategory(
  id: string,
  request: { offset: -1 | 1; control: "handle" | "up" | "down" },
): void {
  void moved(categoryName(id), null, id, request.offset, request.control);
}
function moveProduct(
  categoryId: string,
  id: string,
  request: { offset: -1 | 1; control: "handle" | "up" | "down" },
): void {
  void moved(productName(id), categoryId, id, request.offset, request.control);
}
function startKeyboardDrag(): void {
  keyboardDragSnapshot.value = {
    categoryIds: [...draft.value.categoryIds],
    productIdsByCategory: Object.fromEntries(
      Object.entries(draft.value.productIdsByCategory).map(
        ([categoryId, ids]) => [categoryId, [...ids]],
      ),
    ),
  };
}
async function cancelKeyboardDrag(
  label: string,
  scope: string | null,
  id: string,
): Promise<void> {
  if (keyboardDragSnapshot.value === null) return;
  draft.value = keyboardDragSnapshot.value;
  keyboardDragSnapshot.value = null;
  announcement.value = `${label}: перемещение отменено`;
  await nextTick();
  const ids =
    scope === null
      ? draft.value.categoryIds
      : (draft.value.productIdsByCategory[scope] ?? []);
  const index = ids.indexOf(id);
  if (scope === null && categoryList.value && index >= 0) {
    categoryList.value.scrollTop = categoryVirtual.scrollTopForIndex(
      index,
      categoryList.value.scrollTop,
      categoryList.value.clientHeight,
    );
    onCategoryScroll();
  } else if (scope !== null && index >= 0) {
    const list = productLists.get(scope);
    if (list) {
      const virtual = productVirtual(scope);
      list.scrollTop = virtual.scrollTopForIndex(
        index,
        list.scrollTop,
        list.clientHeight,
      );
      syncProductViewport(scope, list);
    }
  }
  await nextTick();
  document
    .querySelector<HTMLElement>(`[data-reorder-control="${id}:handle"]`)
    ?.focus();
}
function requestClose(): void {
  if (dirtyScopes.value.length === 0) {
    reset();
    emit("cancel");
    return;
  }
  closeRequested.value = true;
  discardOpen.value = true;
}
async function confirmDiscard(): Promise<void> {
  const target = pendingNavigation.value;
  const close = closeRequested.value;
  closeRequested.value = false;
  pendingNavigation.value = null;
  reset();
  if (close) {
    emit("cancel");
    return;
  }
  if (target) await router.push(target);
}
function cancelDiscard(): void {
  closeRequested.value = false;
  pendingNavigation.value = null;
}
onBeforeRouteLeave((to) => {
  if (!dirtyScopes.value.length) return true;
  pendingNavigation.value = to.fullPath;
  discardOpen.value = true;
  return false;
});
onBeforeRouteUpdate((to) => {
  if (to.query.mode !== "reorder" && dirtyScopes.value.length) {
    pendingNavigation.value = to.fullPath;
    discardOpen.value = true;
    return false;
  }
  return true;
});
function focusTitle(): void {
  title.value?.focus();
}
defineExpose({ focusTitle, requestClose });
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (dirtyScopes.value.length === 0) return;
  event.preventDefault();
  event.returnValue = "";
}
onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener("beforeunload", onBeforeUnload),
);
</script>
<style scoped lang="scss">
.menu-reorder {
  margin-top: 24px;
  border: 1px solid var(--expressa-color-border);
  border-radius: 12px;
  overflow: hidden;
}
.menu-reorder__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: var(--expressa-color-surface);
  border-bottom: 1px solid var(--expressa-color-border);
}
.menu-reorder__bar h2,
.menu-reorder__bar p {
  margin: 0;
}
.menu-reorder__status {
  margin-top: 4px !important;
}
.menu-reorder__bar p {
  color: var(--expressa-color-text-secondary);
}
.menu-reorder__actions {
  display: flex;
  gap: 8px;
}
.menu-reorder__products {
  overflow: auto;
  padding-left: 32px;
  background: var(--expressa-color-surface-raised);
}
.menu-reorder__empty-products {
  box-sizing: border-box;
  block-size: 56px;
  margin: 0;
  padding: 16px;
  color: var(--expressa-color-text-secondary);
}
.menu-reorder__list {
  max-height: 70vh;
  overflow: auto;
}
.menu-reorder__disclosure {
  min-height: 44px;
  margin: 0 16px;
  border: 0;
  background: transparent;
  color: var(--expressa-color-accent);
  font: inherit;
}
.menu-reorder__hint {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.menu-reorder__error {
  margin: 12px 16px;
  color: var(--expressa-color-status-error);
}
@media (max-width: 767px) {
  .menu-reorder__bar {
    align-items: stretch;
    flex-direction: column;
  }
  .menu-reorder__actions > * {
    flex: 1;
  }
}
</style>
