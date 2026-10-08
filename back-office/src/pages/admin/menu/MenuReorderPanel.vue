<template>
  <section class="menu-reorder">
    <div class="menu-reorder__bar">
      <div class="menu-reorder__heading">
        <h2 id="menu-reorder-title">Изменение порядка</h2>
        <p v-if="props.pending" class="menu-reorder__status">Сохраняем…</p>
        <p v-else-if="dirtyScopes.length" class="menu-reorder__status">
          Не сохранено
        </p>
      </div>
      <AdminActionGroup align="end" class="menu-reorder__actions">
        <AdminButton
          type="button"
          variant="ghost"
          size="compact"
          :disabled="props.pending"
          @click="requestClose"
          >Отмена</AdminButton
        ><AdminButton
          type="button"
          size="compact"
          :disabled="props.pending || dirtyScopes.length === 0"
          @click="emit('save', dirtyScopes)"
          >Сохранить</AdminButton
        >
      </AdminActionGroup>
    </div>
    <ConfirmDialog
      v-model:open="discardOpen"
      cancel-label="Вернуться"
      confirm-label="Отменить"
      confirm-variant="destructive"
      description="Несохранённый порядок будет потерян."
      title="Отменить изменения порядка?"
      @cancel="cancelDiscard"
      @confirm="confirmDiscard"
    />
    <AdminDialog
      :model-value="fullLabel !== null"
      :title="fullLabel ?? ''"
      :max-width="'var(--expressa-size-confirm-dialog-max-width)'"
      @update:model-value="fullLabel = null"
    />
    <div
      ref="categoryList"
      class="menu-reorder__list"
      @scroll="onCategoryScroll"
    >
      <div
        class="menu-reorder__category-spacer"
        :style="{ height: `${categoryVirtual.beforeSize.value}px` }"
      />
      <section
        v-for="(categoryId, index) in visibleCategoryIds"
        :key="categoryId"
        class="menu-reorder__subtree"
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
          @show-label="fullLabel = categoryName(categoryId)"
          @toggle="toggle(categoryId)"
        />
        <div
          v-if="isExpanded(categoryId)"
          :ref="(element) => setProductList(categoryId, element)"
          class="menu-reorder__products"
          :style="{ blockSize: `${productPanelHeight(categoryId)}px` }"
          @scroll="onProductScroll(categoryId)"
        >
          <p
            v-if="productIds(categoryId).length === 0"
            class="menu-reorder__empty-products"
          >
            Товаров в этой категории пока нет
          </p>
          <div
            v-if="productIds(categoryId).length > 0"
            class="menu-reorder__product-spacer"
            :style="{
              height: `${productVirtual(categoryId).beforeSize.value}px`,
            }"
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
            @move="moveProduct(categoryId, productId, $event)"
            @show-label="fullLabel = productName(productId)"
          />
          <div
            v-if="productIds(categoryId).length > 0"
            class="menu-reorder__product-spacer"
            :style="{
              height: `${productVirtual(categoryId).afterSize.value}px`,
            }"
          />
        </div>
      </section>
      <div
        class="menu-reorder__category-spacer"
        :style="{
          height: `${categoryVirtual.afterSize.value}px`,
        }"
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
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminActionGroup from "../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { useMenuReorderDraft } from "./composables/useMenuReorderDraft";
import type {
  MenuReorderPanelEmits,
  MenuReorderPanelProps,
} from "./MenuReorderPanel.types";
import MenuReorderRow from "./MenuReorderRow.vue";
import { useVirtualSiblingRows } from "./composables/useVirtualSiblingRows";
import { menuReorderGeometry } from "./MenuReorderPanel.constants";
const props = withDefaults(defineProps<MenuReorderPanelProps>(), {
  pending: false,
});
const emit = defineEmits<MenuReorderPanelEmits>();
const categories = toRef(props, "categories");
const products = toRef(props, "products");
const { draft, dirtyScopes, move, reset } = useMenuReorderDraft(
  categories,
  products,
);
const discardOpen = ref(false);
const fullLabel = ref<string | null>(null);
const closeRequested = ref(false);
const pendingNavigation = ref<string | null>(null);
const categoryList = ref<HTMLElement | null>(null);
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
  });
});
async function moved(
  scope: string | null,
  id: string,
  offset: -1 | 1,
): Promise<void> {
  if (!move(scope, id, offset)) {
    return;
  }
  const ids =
    scope === null
      ? draft.value.categoryIds
      : (draft.value.productIdsByCategory[scope] ?? []);
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
}
function moveCategory(
  id: string,
  request: { offset: -1 | 1; control: "handle" | "up" | "down" },
): void {
  void moved(null, id, request.offset);
}
function moveProduct(
  categoryId: string,
  id: string,
  request: { offset: -1 | 1; control: "handle" | "up" | "down" },
): void {
  void moved(categoryId, id, request.offset);
}
function requestClose(): void {
  if (props.pending) return;
  if (dirtyScopes.value.length === 0) {
    reset();
    emit("cancel");
    return;
  }
  closeRequested.value = true;
  discardOpen.value = true;
}
function confirmDiscard(): void {
  if (props.pending) return;
  const target = pendingNavigation.value;
  const close = closeRequested.value;
  closeRequested.value = false;
  pendingNavigation.value = null;
  reset();
  if (close) {
    emit("cancel");
    return;
  }
  if (target) emit("navigate", target);
}
function cancelDiscard(): void {
  closeRequested.value = false;
  pendingNavigation.value = null;
}
function requestNavigation(target: string): boolean {
  if (props.pending) return false;
  if (!dirtyScopes.value.length) return true;
  pendingNavigation.value = target;
  discardOpen.value = true;
  return false;
}
function confirmSaved(): void {
  reset();
}
defineExpose({ requestClose, requestNavigation, confirmSaved });
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
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  overflow: hidden;
}
.menu-reorder__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-sm);
  background: var(--expressa-color-surface);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-reorder__bar h2,
.menu-reorder__bar p {
  margin: 0;
}
.menu-reorder__bar h2 {
  font-size: var(--expressa-font-size-body);
}
.menu-reorder__bar p {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-status);
}
.menu-reorder__status {
  margin-top: var(--expressa-space-2xs);
}
.menu-reorder__heading {
  min-width: 0;
  flex: 1;
}
.menu-reorder__actions {
  margin-inline-start: auto;
  flex-wrap: nowrap;
  flex-shrink: 0;
}
.menu-reorder__products {
  overflow: auto;
  background: var(--expressa-color-surface);
}
.menu-reorder__empty-products {
  box-sizing: border-box;
  block-size: calc(var(--expressa-space-48) + var(--expressa-space-8));
  margin: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
}
.menu-reorder__list {
  max-height: 70vh;
  overflow: auto;
}
.menu-reorder {
  container-type: inline-size;
}
.menu-reorder__actions > * {
  white-space: nowrap;
}
@container (max-width: 640px) {
  .menu-reorder__bar {
    flex-wrap: wrap;
  }
  .menu-reorder__heading {
    flex-basis: 100%;
  }
}
</style>
