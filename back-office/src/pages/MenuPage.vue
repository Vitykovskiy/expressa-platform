<template>
  <PageShell class="menu-page__shell" title="Меню" description="">
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
      <p v-if="catalogSummary" class="menu-page__desktop-summary">
        {{ catalogSummary }}
      </p>
      <AdminButton
        :aria-expanded="managementOpen"
        :disabled="isBusy"
        aria-label="Управление меню"
        class="menu-page__management-toggle"
        title="Управление меню"
        type="button"
        variant="ghost"
        @click="managementOpen = !managementOpen"
      >
        <svg
          aria-hidden="true"
          class="menu-page__management-icon"
          fill="none"
          focusable="false"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      </AdminButton>
      <div :aria-busy="isBusy" :inert="isBusy" class="menu-page__content">
        <div class="menu-page__toolbar">
          <div class="menu-page__actions">
            <AdminButton
              :disabled="isBusy"
              type="button"
              @click="addCategoryOpen = true"
              >Добавить группу</AdminButton
            >
            <AdminButton
              :disabled="isBusy"
              type="button"
              variant="secondary"
              @click="addProductOpen = true"
              >Добавить товар</AdminButton
            >
          </div>
        </div>
        <p v-if="orderedCategories.length === 0" class="menu-page__state">
          Категорий пока нет. Добавьте первую категорию.
        </p>
        <section
          v-else
          class="menu-page__section"
          aria-labelledby="menu-main-heading"
        >
          <h2 id="menu-main-heading" class="menu-page__section-title">
            Основное меню
          </h2>
          <div class="menu-page__table">
            <MenuCategoryGroup
              v-for="(category, index) in orderedCategories"
              :key="category.id"
              :category="category"
              :can-move-up="index > 0"
              :can-move-down="index < orderedCategories.length - 1"
              :disabled="isBusy"
              :expanded="expandedCategoryIds.has(category.id)"
              :products="productsByCategory(category.id)"
              :show-management-actions="managementOpen"
              @edit="openProductEditor"
              @edit-category="openCategoryEditor"
              @move-up="moveCategoryUp"
              @move-down="moveCategoryDown"
              @move-product-up="moveProductUp"
              @move-product-down="moveProductDown"
              @toggle="toggleCategory"
            />
          </div>
        </section>
        <section
          v-if="modifierGroups.length > 0"
          class="menu-page__section"
          aria-labelledby="menu-options-heading"
        >
          <h2 id="menu-options-heading" class="menu-page__section-title">
            Группы опций
          </h2>
          <div class="menu-page__table">
            <section
              v-for="group in modifierGroups"
              :key="group.id"
              class="menu-page__option-group"
            >
              <header class="menu-page__option-header">
                <AdminButton
                  :aria-expanded="expandedModifierGroupIds.has(group.id)"
                  :disabled="isBusy"
                  class="menu-page__option-toggle"
                  type="button"
                  variant="ghost"
                  @click="toggleModifierGroup(group)"
                >
                  <svg
                    aria-hidden="true"
                    class="menu-page__option-chevron"
                    fill="none"
                    focusable="false"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      :d="
                        expandedModifierGroupIds.has(group.id)
                          ? 'm6 9 6 6 6-6'
                          : 'm9 18 6-6-6-6'
                      "
                    />
                  </svg>
                  <span class="menu-page__option-copy">
                    <span class="menu-page__option-name">{{ group.name }}</span>
                    <span class="menu-page__option-count">
                      {{ modifierOptionCountLabel(group.options.length) }}
                    </span>
                  </span>
                </AdminButton>
                <AdminButton
                  :aria-label="`Редактировать группу опций ${group.name}`"
                  :disabled="isBusy"
                  class="menu-page__option-edit"
                  type="button"
                  variant="ghost"
                  @click="openModifierGroupEditor(group)"
                >
                  <svg
                    aria-hidden="true"
                    class="menu-page__option-edit-icon"
                    fill="none"
                    focusable="false"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span class="menu-page__visually-hidden">Редактировать</span>
                </AdminButton>
              </header>
              <div
                v-if="expandedModifierGroupIds.has(group.id)"
                class="menu-page__option-list"
              >
                <p
                  v-if="group.options.length === 0"
                  class="menu-page__option-empty"
                >
                  Опций в этой группе пока нет
                </p>
                <AdminButton
                  v-for="option in group.options"
                  v-else
                  :key="option.id"
                  :aria-label="`Редактировать группу опций ${group.name}`"
                  class="menu-page__option-row"
                  type="button"
                  variant="ghost"
                  @click="openModifierGroupEditor(group)"
                >
                  <span class="menu-page__option-row-copy">
                    <span>{{ option.name }}</span>
                    <span class="menu-page__option-price">
                      {{ modifierOptionPrice(option.priceDeltaMinor) }}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    class="menu-page__option-chevron"
                    fill="none"
                    focusable="false"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </AdminButton>
              </div>
            </section>
          </div>
        </section>
        <section
          v-if="managementOpen"
          class="menu-page__management"
          aria-label="Управление меню"
        >
          <div class="menu-page__management-heading">
            <h2>Управление меню</h2>
            <AdminButton
              :disabled="isBusy"
              type="button"
              variant="secondary"
              @click="openModifierGroupEditor(null)"
              >Новая группа опций</AdminButton
            >
          </div>
          <div class="menu-page__catalog-tools">
            <section class="menu-page__editor-section">
              <h3>Назначения категорий</h3>
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
              <h3>Группы опций категории</h3>
              <p class="menu-page__state">
                Выберите группу меню, чтобы настроить её опции.
              </p>
            </section>
            <CategoryModifierAssignments
              v-else
              class="menu-page__assignments"
              :assignments="catalogStore.categoryModifierGroupAssignments"
              :categories="orderedCategories"
              :category="selectedCategory"
              :disabled="catalogStore.status === 'loading'"
              :groups="modifierGroups"
              @cancel="selectedCategory = null"
              @save="saveAssignments"
            />
          </div>
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
import AddCategoryDialog from "./admin/menu/AddCategoryDialog.vue";
import type { CategoryFormData } from "./admin/menu/AddCategoryDialog.types";
import AddProductDialog from "./admin/menu/AddProductDialog.vue";
import type { ProductFormData } from "./admin/menu/AddProductDialog.types";
import CategoryModifierAssignments from "./admin/menu/CategoryModifierAssignments.vue";
import EditCategoryDialog from "./admin/menu/EditCategoryDialog.vue";
import EditProductDialog from "./admin/menu/EditProductDialog.vue";
import MenuCategoryGroup from "./admin/menu/MenuCategoryGroup.vue";
import ModifierGroupEditor from "./admin/menu/ModifierGroupEditor.vue";
import type { ModifierGroupFormData } from "./admin/menu/ModifierGroupEditor.types";
import { useDialogFocusLifecycle } from "./admin/menu/composables/useDialogFocusLifecycle";
import { useCatalogStore } from "./admin/menu/catalog.store";
import type {
  Category,
  ModifierGroup,
  Product,
} from "./admin/menu/catalog.types";
import AdminButton from "../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../shared/ui/admin/admin-dialog/AdminDialog.vue";
import PageShell from "./PageShell.vue";

const sessionStore = useSessionStore();
const catalogStore = useCatalogStore();
const addCategoryOpen = shallowRef(false);
const addProductOpen = shallowRef(false);
const editCategoryOpen = shallowRef(false);
const editProductOpen = shallowRef(false);
const modifierGroupEditorOpen = shallowRef(false);
const expandedCategoryIds = shallowRef<ReadonlySet<string>>(new Set());
const expandedModifierGroupIds = shallowRef<ReadonlySet<string>>(new Set());
const managementOpen = shallowRef(false);
const selectedCategory = shallowRef<Category | null>(null);
const selectedModifierGroup = shallowRef<ModifierGroup | null>(null);
const selectedProduct = shallowRef<Product | null>(null);
const hasConfirmedCatalog = shallowRef(catalogStore.status === "ready");
const isBusy = computed(() => catalogStore.status === "loading");
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();

const orderedCategories = computed(() =>
  [...catalogStore.categories].sort(bySortOrder),
);
const modifierGroups = computed(() => catalogStore.modifierGroups);
const catalogSummary = computed(() => {
  const categoryCount = orderedCategories.value.length;
  const modifierGroupCount = modifierGroups.value.length;

  if (categoryCount === 0 && modifierGroupCount === 0) return "";

  return `${categoryCount} групп · ${modifierGroupCount} групп опций`;
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

function toggleModifierGroup(group: ModifierGroup): void {
  const next = new Set(expandedModifierGroupIds.value);
  if (next.has(group.id)) next.delete(group.id);
  else next.add(group.id);
  expandedModifierGroupIds.value = next;
}

function modifierOptionPrice(priceDeltaMinor: number): string {
  if (priceDeltaMinor === 0) return "Бесплатно";
  return `${priceDeltaMinor / 100} ₽`;
}

function modifierOptionCountLabel(count: number): string {
  const label =
    count === 1 ? "опция" : count >= 2 && count <= 4 ? "опции" : "опций";

  return `${count} ${label}`;
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
</script>

<style scoped lang="scss">
.menu-page__shell {
  min-height: 100%;
  position: relative;
  background: var(--expressa-color-surface);
}

:deep(.page-shell-description) {
  display: none;
}

.menu-page__desktop-summary {
  position: absolute;
  top: 35px;
  right: var(--expressa-space-lg);
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
}

.menu-page__management-toggle {
  position: absolute;
  z-index: 1;
  display: grid;
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  place-items: center;
  padding: 0;
  color: var(--expressa-color-text-secondary);
}

.menu-page__management-icon,
.menu-page__option-chevron,
.menu-page__option-edit-icon {
  width: 18px;
  height: 18px;
}

.menu-page__content,
.menu-page__section,
.menu-page__management,
.menu-page__catalog-tools,
.menu-page__editor-section,
.menu-page__error {
  display: grid;
  gap: var(--expressa-space-md);
}

.menu-page__content {
  gap: var(--expressa-space-lg);
}

.menu-page__toolbar,
.menu-page__actions,
.menu-page__management-heading {
  display: flex;
  gap: var(--expressa-space-sm);
  align-items: center;
}

.menu-page__toolbar,
.menu-page__management-heading {
  justify-content: space-between;
}

.menu-page__section {
  gap: var(--expressa-space-control-inline);
}

.menu-page__section-title {
  margin: 0;
  padding-inline: var(--expressa-space-xs);
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-medium);
  letter-spacing: var(--expressa-letter-spacing-section-title);
  line-height: var(--expressa-line-height-caption);
  text-transform: uppercase;
}

.menu-page__table {
  overflow: hidden;
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.menu-page__option-group:not(:last-child) {
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-page__option-header,
.menu-page__option-row {
  display: flex;
  min-height: 70px;
  background: var(--expressa-color-surface-raised);
}

.menu-page__option-toggle,
.menu-page__option-edit,
.menu-page__option-row {
  border: var(--expressa-border-width-none);
  border-radius: 0;
}

.menu-page__option-toggle {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: var(--expressa-space-control-inline);
  padding: 14px var(--expressa-space-md) 14px 20px;
  text-align: left;
}

.menu-page__option-copy,
.menu-page__option-row-copy {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-2xs);
}

.menu-page__option-chevron {
  flex: 0 0 18px;
}

.menu-page__option-name {
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-page__option-count,
.menu-page__option-price {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}

.menu-page__option-edit {
  display: grid;
  width: 48px;
  min-width: 48px;
  place-items: center;
  padding: 0;
  color: var(--expressa-color-accent);
}

.menu-page__option-row {
  width: 100%;
  min-height: 63px;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: 14px var(--expressa-space-md) 14px
    var(--expressa-space-product-indent);
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
  text-align: left;
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-page__option-empty {
  margin: 0;
  padding: var(--expressa-space-xl) var(--expressa-space-md);
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
  text-align: center;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-page__management {
  padding-top: var(--expressa-space-lg);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.menu-page__management-heading h2,
.menu-page__editor-section h3,
.menu-page__assignments h3 {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
}

.menu-page__catalog-tools {
  grid-template-columns: minmax(0, 0.4fr) minmax(0, 0.6fr);
}

.menu-page__editor-section,
.menu-page__assignments {
  padding: var(--expressa-space-md);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.menu-page__group-button {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  min-height: var(--expressa-size-control-min-height);
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

.menu-page__modifier-dialog {
  max-block-size: calc(100dvh - var(--expressa-space-xl));
  min-width: 0;
  overflow-y: auto;
}

.menu-page__modifier-dialog-content {
  min-width: 0;
}

.menu-page__visually-hidden {
  position: absolute;
  width: var(--expressa-size-visually-hidden);
  height: var(--expressa-size-visually-hidden);
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 767px) {
  :deep(.page-shell-title) {
    display: flex;
    min-height: var(--expressa-size-top-bar-min-height);
    align-items: center;
    margin: 0;
    padding: 0 var(--expressa-space-md);
    font-size: var(--expressa-font-size-title);
    border-bottom: var(--expressa-border-width-default) solid
      var(--expressa-color-border);
  }

  :deep(.page-shell-content) {
    margin-top: 0;
    padding: var(--expressa-space-md) var(--expressa-space-md)
      var(--expressa-space-tab-bar-clearance);
  }

  .menu-page__desktop-summary {
    display: none;
  }

  .menu-page__management-toggle {
    top: var(--expressa-space-xs);
    right: var(--expressa-space-md);
  }

  .menu-page__actions {
    width: 100%;
  }

  .menu-page__actions > .admin-button:first-child {
    flex: 1.25;
  }

  .menu-page__actions > .admin-button:last-child {
    flex: 1;
  }
}

@media (min-width: 768px) {
  .menu-page__shell {
    padding: 21px var(--expressa-space-lg) var(--expressa-space-lg);
  }

  :deep(.page-shell-title) {
    margin: 0;
    font-size: var(--expressa-font-size-screen-title);
  }

  :deep(.page-shell-content) {
    margin-top: var(--expressa-space-md);
  }

  .menu-page__management-toggle {
    top: 21px;
    right: 184px;
  }
}
</style>
