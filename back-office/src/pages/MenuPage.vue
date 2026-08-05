<template>
  <PageShell title="Меню" description="Категории, товары и добавки">
    <p
      v-if="catalogStore.status === 'loading'"
      class="menu-page__state"
      role="status"
    >
      Загружаем меню…
    </p>
    <section
      v-if="catalogStore.status === 'error'"
      class="menu-page__error"
      role="alert"
    >
      <p>{{ catalogStore.error?.message }}</p>
      <AdminButton type="button" @click="loadCatalog">Повторить</AdminButton>
    </section>
    <template v-if="hasConfirmedCatalog">
      <div :aria-busy="isBusy" :inert="isBusy" class="menu-page__content">
        <div class="menu-page__actions">
          <AdminButton
            :disabled="isBusy"
            type="button"
            @click="addCategoryOpen = true"
            >Добавить категорию</AdminButton
          >
          <AdminButton
            :disabled="isBusy"
            type="button"
            variant="secondary"
            @click="addProductOpen = true"
            >Добавить товар</AdminButton
          >
          <AdminButton
            :disabled="isBusy"
            type="button"
            variant="secondary"
            @click="openModifierGroupEditor(null)"
            >Новая группа добавок</AdminButton
          >
        </div>
        <div class="menu-page__catalog-heading">
          <h2>Категории</h2>
          <p>{{ categorySummary }}</p>
        </div>
        <p v-if="orderedCategories.length === 0" class="menu-page__state">
          Категорий пока нет. Добавьте первую категорию.
        </p>
        <div v-else class="menu-page__categories">
          <MenuCategoryGroup
            v-for="(category, index) in orderedCategories"
            :key="category.id"
            :category="category"
            :can-move-up="index > 0"
            :can-move-down="index < orderedCategories.length - 1"
            :disabled="isBusy"
            :expanded="expandedCategoryIds.has(category.id)"
            :products="productsByCategory(category.id)"
            @edit="openProductEditor"
            @edit-category="openCategoryEditor"
            @move-up="moveCategoryUp"
            @move-down="moveCategoryDown"
            @move-product-up="moveProductUp"
            @move-product-down="moveProductDown"
            @toggle="toggleCategory"
          />
        </div>
        <section class="menu-page__catalog-tools" aria-label="Настройки меню">
          <section class="menu-page__editor-section">
            <h2>Группы добавок</h2>
            <p
              v-if="orderedModifierGroups.length === 0"
              class="menu-page__state"
            >
              Групп добавок пока нет.
            </p>
            <AdminButton
              v-for="group in orderedModifierGroups"
              :key="group.id"
              class="menu-page__group-button"
              :disabled="isBusy"
              type="button"
              variant="ghost"
              @click="openModifierGroupEditor(group)"
              >{{ group.name }}</AdminButton
            >
          </section>
          <section class="menu-page__editor-section">
            <h2>Назначения категорий</h2>
            <AdminButton
              v-for="category in orderedCategories"
              :key="category.id"
              class="menu-page__group-button"
              :disabled="isBusy"
              type="button"
              variant="ghost"
              @click="selectedCategory = category"
              >{{ category.name }}</AdminButton
            >
          </section>
          <section
            v-if="selectedCategory === null"
            class="menu-page__assignments"
          >
            <h2>Группы добавок категории</h2>
            <p class="menu-page__state">
              Выберите категорию, чтобы настроить её добавки.
            </p>
          </section>
          <CategoryModifierAssignments
            v-else
            class="menu-page__assignments"
            :assignments="catalogStore.categoryModifierGroupAssignments"
            :categories="orderedCategories"
            :category="selectedCategory"
            :disabled="catalogStore.status === 'loading'"
            :groups="orderedModifierGroups"
            @cancel="selectedCategory = null"
            @save="saveAssignments"
          />
        </section>
      </div>
    </template>
    <AddCategoryDialog
      v-model:open="addCategoryOpen"
      :disabled="isBusy"
      :field-errors="categoryFieldErrors"
      @cancel="addCategoryOpen = false"
      @confirm="createCategory"
    />
    <EditCategoryDialog
      v-model:open="editCategoryOpen"
      :disabled="isBusy"
      :category="selectedCategory"
      :field-errors="categoryFieldErrors"
      @archive="archiveCategory"
      @cancel="selectedCategory = null"
      @save="updateCategory"
    />
    <AddProductDialog
      v-model:open="addProductOpen"
      :disabled="isBusy"
      :categories="orderedCategories"
      :field-errors="productFieldErrors"
      @cancel="addProductOpen = false"
      @confirm="createProduct"
    />
    <EditProductDialog
      v-model:open="editProductOpen"
      :disabled="isBusy"
      :categories="orderedCategories"
      :field-errors="productFieldErrors"
      :product="selectedProduct"
      @cancel="selectedProduct = null"
      @delete="archiveProduct"
      @save="updateProduct"
    />
    <AdminDialog
      :model-value="modifierGroupEditorOpen"
      max-width="800"
      @update:model-value="updateModifierGroupEditorOpen"
    >
      <v-card class="menu-page__modifier-dialog">
        <v-card-text class="menu-page__modifier-dialog-content">
          <ModifierGroupEditor
            :disabled="catalogStore.status === 'loading'"
            :field-errors="modifierFieldErrors"
            :group="selectedModifierGroup"
            @archive="archiveModifierGroup"
            @cancel="closeModifierGroupEditor"
            @save="saveModifierGroup"
          />
        </v-card-text>
      </v-card>
    </AdminDialog>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from "vue";

import { useSessionStore } from "../app/session.store";
import AddCategoryDialog from "../admin/pages/menu/AddCategoryDialog.vue";
import type { CategoryFormData } from "../admin/pages/menu/AddCategoryDialog.types";
import AddProductDialog from "../admin/pages/menu/AddProductDialog.vue";
import type { ProductFormData } from "../admin/pages/menu/AddProductDialog.types";
import CategoryModifierAssignments from "../admin/pages/menu/CategoryModifierAssignments.vue";
import EditCategoryDialog from "../admin/pages/menu/EditCategoryDialog.vue";
import EditProductDialog from "../admin/pages/menu/EditProductDialog.vue";
import MenuCategoryGroup from "../admin/pages/menu/MenuCategoryGroup.vue";
import ModifierGroupEditor from "../admin/pages/menu/ModifierGroupEditor.vue";
import type { ModifierGroupFormData } from "../admin/pages/menu/ModifierGroupEditor.types";
import { useDialogFocusLifecycle } from "../admin/pages/menu/composables/useDialogFocusLifecycle";
import { useCatalogStore } from "../admin/pages/menu/catalog.store";
import type {
  Category,
  ModifierGroup,
  Product,
} from "../admin/pages/menu/catalog.types";
import AdminButton from "../admin/shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../admin/shared/ui/admin-dialog/AdminDialog.vue";
import PageShell from "./PageShell.vue";

const sessionStore = useSessionStore();
const catalogStore = useCatalogStore();
const addCategoryOpen = shallowRef(false);
const addProductOpen = shallowRef(false);
const editCategoryOpen = shallowRef(false);
const editProductOpen = shallowRef(false);
const modifierGroupEditorOpen = shallowRef(false);
const expandedCategoryIds = shallowRef<ReadonlySet<string>>(new Set());
const selectedCategory = shallowRef<Category | null>(null);
const selectedModifierGroup = shallowRef<ModifierGroup | null>(null);
const selectedProduct = shallowRef<Product | null>(null);
const hasConfirmedCatalog = shallowRef(catalogStore.status === "ready");
const isBusy = computed(() => catalogStore.status === "loading");
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();

const orderedCategories = computed(() =>
  [...catalogStore.categories].sort(bySortOrder),
);
const orderedModifierGroups = computed(() =>
  [...catalogStore.modifierGroups].sort(byName),
);
const categorySummary = computed(() => {
  const count = orderedCategories.value.length;

  return count === 1 ? "1 категория" : `${count} категорий`;
});
const categoryFieldErrors = computed(() => catalogStore.fieldErrors);
const productFieldErrors = computed(() => catalogStore.fieldErrors);
const modifierFieldErrors = computed(() => catalogStore.fieldErrors);

onMounted(loadCatalog);

watch(
  () => catalogStore.status,
  (status) => {
    if (status === "ready") hasConfirmedCatalog.value = true;
  },
);

watch(modifierGroupEditorOpen, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) captureReturnFocus();
  if (!isOpen && wasOpen) restoreFocus();
});

function accessToken(): string | null {
  return sessionStore.accessToken;
}

async function loadCatalog(): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue !== null) await catalogStore.load(authorizationValue);
}

function productsByCategory(categoryId: string): readonly Product[] {
  return catalogStore.products
    .filter((product) => product.categoryId === categoryId)
    .sort(bySortOrder);
}

function nextProductSortOrder(categoryId: string): number {
  return (
    catalogStore.products.reduce(
      (maximum, product) =>
        product.categoryId === categoryId
          ? Math.max(maximum, product.sortOrder)
          : maximum,
      -1,
    ) + 1
  );
}

function nextCategorySortOrder(): number {
  return (
    catalogStore.categories.reduce(
      (maximum, category) => Math.max(maximum, category.sortOrder),
      -1,
    ) + 1
  );
}

function toggleCategory(category: Category): void {
  const next = new Set(expandedCategoryIds.value);
  if (next.has(category.id)) next.delete(category.id);
  else next.add(category.id);
  expandedCategoryIds.value = next;
}

function openCategoryEditor(category: Category): void {
  selectedCategory.value = category;
  editCategoryOpen.value = true;
}

function openProductEditor(product: Product): void {
  selectedProduct.value = product;
  editProductOpen.value = true;
}

function openModifierGroupEditor(group: ModifierGroup | null): void {
  selectedModifierGroup.value = group;
  modifierGroupEditorOpen.value = true;
}

function closeModifierGroupEditor(): void {
  selectedModifierGroup.value = null;
  modifierGroupEditorOpen.value = false;
}

function updateModifierGroupEditorOpen(isOpen: boolean): void {
  if (!isOpen) closeModifierGroupEditor();
}

async function createCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  await catalogStore.createCategory(authorizationValue, {
    ...data,
    sortOrder: nextCategorySortOrder(),
  });
  if (catalogStore.lastCommandSucceeded) addCategoryOpen.value = false;
}

async function updateCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  const category = selectedCategory.value;
  if (
    authorizationValue === null ||
    category === null ||
    catalogStore.status === "loading"
  )
    return;
  await catalogStore.updateCategory(authorizationValue, category.id, {
    ...data,
    sortOrder: category.sortOrder,
  });
  if (catalogStore.lastCommandSucceeded) editCategoryOpen.value = false;
}

async function archiveCategory(categoryId: string): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  await catalogStore.archiveCategory(authorizationValue, categoryId);
  if (catalogStore.lastCommandSucceeded) selectedCategory.value = null;
}

async function createProduct(data: ProductFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  await catalogStore.createProduct(authorizationValue, {
    ...data,
    sortOrder: nextProductSortOrder(data.categoryId),
  });
  if (catalogStore.lastCommandSucceeded) addProductOpen.value = false;
}

async function updateProduct(data: ProductFormData): Promise<void> {
  const authorizationValue = accessToken();
  const product = selectedProduct.value;
  if (
    authorizationValue === null ||
    product === null ||
    catalogStore.status === "loading"
  )
    return;
  await catalogStore.updateProduct(authorizationValue, product.id, {
    ...data,
    sortOrder:
      data.categoryId === product.categoryId
        ? product.sortOrder
        : nextProductSortOrder(data.categoryId),
  });
  if (catalogStore.lastCommandSucceeded) editProductOpen.value = false;
}

async function archiveProduct(): Promise<void> {
  const authorizationValue = accessToken();
  const product = selectedProduct.value;
  if (
    authorizationValue === null ||
    product === null ||
    catalogStore.status === "loading"
  )
    return;
  await catalogStore.archiveProduct(authorizationValue, product.id);
  if (catalogStore.lastCommandSucceeded) selectedProduct.value = null;
}

async function moveCategoryUp(category: Category): Promise<void> {
  await moveCategory(category, -1);
}

async function moveCategoryDown(category: Category): Promise<void> {
  await moveCategory(category, 1);
}

async function moveCategory(category: Category, offset: -1 | 1): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  const ids = orderedCategories.value.map((item) => item.id);
  const index = ids.indexOf(category.id);
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return;
  [ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!];
  await catalogStore.reorderCategories(authorizationValue, ids);
}

async function moveProductUp(product: Product): Promise<void> {
  await moveProduct(product, -1);
}

async function moveProductDown(product: Product): Promise<void> {
  await moveProduct(product, 1);
}

async function moveProduct(product: Product, offset: -1 | 1): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  const ids = productsByCategory(product.categoryId).map((item) => item.id);
  const index = ids.indexOf(product.id);
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return;
  [ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!];
  await catalogStore.reorderProducts(
    authorizationValue,
    product.categoryId,
    ids,
  );
}

async function saveModifierGroup(data: ModifierGroupFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  await catalogStore.saveModifierGroup(authorizationValue, data);
  if (catalogStore.lastCommandSucceeded) closeModifierGroupEditor();
}

async function saveAssignments(
  assignments: readonly {
    categoryId: string;
    modifierGroupId: string;
    sortOrder: number;
  }[],
): Promise<void> {
  const authorizationValue = accessToken();
  const category = selectedCategory.value;
  if (
    authorizationValue === null ||
    category === null ||
    catalogStore.status === "loading"
  )
    return;
  await catalogStore.replaceCategoryModifierGroups(
    authorizationValue,
    category.id,
    assignments,
  );
}

async function archiveModifierGroup(groupId: string): Promise<void> {
  const authorizationValue = accessToken();
  if (authorizationValue === null || catalogStore.status === "loading") return;
  await catalogStore.archiveModifierGroup(authorizationValue, groupId);
  if (catalogStore.lastCommandSucceeded) closeModifierGroupEditor();
}

function bySortOrder(
  left: { sortOrder: number },
  right: { sortOrder: number },
): number {
  return left.sortOrder - right.sortOrder;
}

function byName(left: ModifierGroup, right: ModifierGroup): number {
  return left.name.localeCompare(right.name, "ru");
}
</script>

<style scoped lang="scss">
.menu-page__actions,
.menu-page__categories,
.menu-page__catalog-tools,
.menu-page__editor-section,
.menu-page__error {
  display: grid;
  gap: var(--expressa-space-md);
}
.menu-page__actions {
  grid-template-columns: repeat(3, minmax(0, max-content));
  justify-content: start;
  padding-bottom: var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-page__catalog-heading {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-sm);
  align-items: baseline;
}
.menu-page__catalog-heading h2,
.menu-page__editor-section h2 {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
}
.menu-page__catalog-heading p {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-action);
}
.menu-page__state {
  margin: 0;
  color: var(--expressa-color-text-muted);
}
.menu-page__error {
  color: var(--expressa-color-status-error);
}
.menu-page__error p {
  margin: 0;
}
.menu-page__categories {
  grid-template-columns: minmax(0, 1fr);
}
.menu-page__catalog-tools {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: var(--expressa-space-xl);
}
.menu-page__editor-section,
.menu-page__assignments {
  padding: var(--expressa-space-md);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}
.menu-page__assignments {
  grid-column: 1 / -1;
}
.menu-page__group-button {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  min-height: var(--expressa-size-control-min-height);
}
.menu-page__modifier-dialog {
  max-block-size: calc(100dvh - var(--expressa-space-xl));
  min-width: 0;
  overflow-y: auto;
}
.menu-page__modifier-dialog-content {
  min-width: 0;
}
@media (max-width: 767px) {
  .menu-page__actions {
    grid-template-columns: minmax(0, 1fr);
  }
  .menu-page__catalog-tools {
    grid-template-columns: minmax(0, 1fr);
  }
  .menu-page__assignments {
    grid-column: auto;
  }
}
</style>
