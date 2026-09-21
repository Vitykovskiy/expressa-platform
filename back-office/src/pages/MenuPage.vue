<template>
  <PageShell class="menu-page__shell" title="Меню">
    <p
      v-if="
        catalogStore.status === 'loading' && modifierPendingMessage === null
      "
      class="menu-page__state"
      role="status"
    >
      Загружаем меню…
    </p>
    <section
      v-if="catalogStore.status === 'error' && !activeForm"
      class="menu-page__error"
      role="alert"
    >
      <p>{{ catalogReadErrorMessage }}</p>
      <p>Загрузите актуальное меню, чтобы проверить текущее состояние.</p>
      <details v-if="catalogStore.error" class="menu-page__error-details">
        <summary>Технические сведения</summary>
        <p>{{ catalogStore.error.message }}</p>
        <p v-if="catalogStore.error.requestId">
          Идентификатор запроса: {{ catalogStore.error.requestId }}
        </p>
      </details>
      <AdminButton
        class="menu-page__error-recovery"
        type="button"
        variant="secondary"
        @click="loadCatalog"
        >Загрузить меню</AdminButton
      >
    </section>
    <template v-if="hasConfirmedCatalog">
      <div :aria-busy="isBusy" :inert="isBusy" class="menu-page__content">
        <MenuOverview
          v-if="!managementOpen"
          ref="menuOverview"
          :categories="orderedCategories"
          :expanded-category-ids="expandedCategoryIds"
          :highlighted-category-id="highlightedCategoryId"
          :modifier-groups="modifierGroups"
          :products="catalogStore.products"
          :reorder-saved="reorderSaved"
          :disabled="isBusy"
          @add-category="openNewCategoryForm"
          @add-modifier-group="openModifierGroupEditor(null)"
          @add-product="openNewProductForm"
          @edit-category="openCategoryEditor"
          @edit-product="openProductEditor"
          @edit-modifier-group="openModifierGroupEditor"
          @reorder="toggleReorder"
          @toggle-category="toggleCategory"
        />
        <MenuReorderPanel
          v-if="managementOpen"
          ref="reorderPanel"
          :categories="orderedCategories"
          :products="catalogStore.products"
          :expanded-category-ids="expandedCategoryIds"
          :pending="reorderPending"
          :error="reorderError"
          @cancel="closeReorder"
          @request-close="closeReorder"
          @save="saveReorder"
          @update:expanded-category-ids="expandedCategoryIds = $event"
        />
      </div>
    </template>
    <AddCategoryDialog
      v-model:open="addCategoryOpen"
      :categories="orderedCategories"
      :disabled="isBusy"
      :field-errors="categoryFieldErrors"
      :save-error="catalogStore.formSaveError"
      :save-outcome="categoryFormSaveOutcome"
      @cancel="closeNewCategoryForm"
      @confirm="createCategory"
      @refresh="refreshCategoryCatalog"
    />
    <EditCategoryDialog
      v-model:open="editCategoryOpen"
      :archive-error="categoryArchiveError"
      :archive-pending="categoryArchivePending"
      :categories="orderedCategories"
      :disabled="isBusy"
      :category="selectedCategory"
      :field-errors="categoryFieldErrors"
      :save-error="catalogStore.formSaveError"
      :save-outcome="categoryFormSaveOutcome"
      @archive="archiveCategory"
      @cancel="closeCategoryEditor"
      @save="updateCategory"
      @refresh="refreshCategoryCatalog"
    />
    <AddProductDialog
      v-model:open="addProductOpen"
      :disabled="isBusy"
      :categories="orderedCategories"
      :field-errors="productFieldErrors"
      :save-error="catalogStore.formSaveError"
      :save-outcome="productFormSaveOutcome"
      @cancel="closeNewProductForm"
      @confirm="createProduct"
      @refresh="refreshProductCatalog"
    />
    <AdminDialog
      :model-value="modifierGroupEditorOpen"
      aria-labelledby="modifier-group-editor-title"
      max-width="800"
      :persistent="modifierDialogPending"
      @update:model-value="updateModifierGroupEditorOpen"
    >
      <v-card class="menu-page__modifier-dialog">
        <v-card-text class="menu-page__modifier-dialog-content">
          <ModifierGroupEditor
            :key="modifierEditorSession"
            :disabled="modifierDialogPending"
            :field-errors="modifierFieldErrors"
            :group="selectedModifierGroup"
            :pending-message="modifierPendingMessage"
            :operation-kind="modifierOperationKind"
            :save-error="catalogStore.formSaveError"
            :save-outcome="modifierFormSaveOutcome"
            @archive="archiveModifierGroup"
            @cancel="closeModifierGroupEditor"
            @save="saveModifierGroup"
            @refresh="refreshModifierGroupCatalog"
          />
        </v-card-text>
      </v-card>
    </AdminDialog>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import AddCategoryDialog from "./admin/menu/AddCategoryDialog.vue";
import type { CategoryFormData } from "./admin/menu/AddCategoryDialog.types";
import AddProductDialog from "./admin/menu/AddProductDialog.vue";
import type { CreateProductFormData } from "./admin/menu/AddProductDialog.types";
import EditCategoryDialog from "./admin/menu/EditCategoryDialog.vue";
import MenuReorderPanel from "./admin/menu/MenuReorderPanel.vue";
import MenuOverview from "./admin/menu/MenuOverview.vue";
import type { MenuReorderScope } from "./admin/menu/composables/useMenuReorderDraft.types";
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
const route = useRoute();
const router = useRouter();
const catalogStore = useCatalogStore();
const addCategoryOpen = shallowRef(false);
const addProductOpen = shallowRef(false);
const editCategoryOpen = shallowRef(false);
const modifierGroupEditorOpen = shallowRef(false);
const modifierEditorSession = shallowRef(0);
const expandedCategoryIds = shallowRef<ReadonlySet<string>>(new Set());
const managementOpen = computed(() => route.query.mode === "reorder");
const reorderPending = shallowRef(false);
const reorderError = shallowRef<string | null>(null);
const reorderSaved = shallowRef(false);
const reorderPanel = shallowRef<{
  focusTitle: () => void;
  requestClose: () => void;
} | null>(null);
const menuOverview = shallowRef<{
  focusAddCategoryAction: () => void;
  focusReorderAction: () => void;
} | null>(null);
const selectedCategory = shallowRef<Category | null>(null);
const selectedModifierGroup = shallowRef<ModifierGroup | null>(null);
const productRecoveryState = shallowRef<
  "idle" | "checking" | "retry" | "checked"
>("idle");
const categoryRecoveryState = shallowRef<
  "idle" | "checking" | "retry" | "checked"
>("idle");
const categoryArchivePending = shallowRef(false);
const categoryArchiveError = shallowRef<string | null>(null);
const highlightedCategoryId = shallowRef<string | null>(null);
const modifierRecoveryState = shallowRef<
  "idle" | "checking" | "retry" | "checked"
>("idle");
const modifierOperationKind = shallowRef<"save" | "archive" | null>(null);
const modifierSaveInFlight = shallowRef(false);
const acknowledgedForm = shallowRef<
  "category" | "product" | "modifier" | "modifier-archive" | null
>(null);
const hasConfirmedCatalog = shallowRef(catalogStore.status === "ready");
const isBusy = computed(() => catalogStore.status === "loading");
const activeForm = computed(
  () =>
    addCategoryOpen.value ||
    editCategoryOpen.value ||
    addProductOpen.value ||
    modifierGroupEditorOpen.value,
);
const categoryFormSaveOutcome = computed(() =>
  categoryRecoveryState.value === "checked"
    ? "saved"
    : categoryRecoveryState.value === "checking" ||
        categoryRecoveryState.value === "retry"
      ? "unconfirmed"
      : catalogStore.formSaveOutcome,
);
const productFormSaveOutcome = computed(() =>
  productRecoveryState.value === "checked"
    ? "saved"
    : productRecoveryState.value === "checking" ||
        productRecoveryState.value === "retry"
      ? "unconfirmed"
      : catalogStore.formSaveOutcome,
);
const modifierDialogPending = computed(
  () =>
    catalogStore.status === "loading" ||
    modifierRecoveryState.value === "checking",
);
const modifierFormSaveOutcome = computed(() =>
  modifierRecoveryState.value === "checking" ||
  modifierRecoveryState.value === "retry"
    ? "unconfirmed"
    : modifierRecoveryState.value === "checked"
      ? "checked"
      : catalogStore.formSaveOutcome,
);
const modifierPendingMessage = computed<string | null>(() => {
  if (modifierRecoveryState.value === "checking")
    return "Проверяем актуальное меню…";
  if (!modifierSaveInFlight.value) return null;
  if (catalogStore.formSaveOutcome === "saved")
    return modifierOperationKind.value === "archive"
      ? "Группа архивирована. Обновляем меню…"
      : "Группа сохранена. Обновляем меню…";
  return modifierOperationKind.value === "archive"
    ? "Архивируем группу…"
    : "Сохраняем группу…";
});
const catalogReadErrorMessage = computed(() =>
  catalogStore.formSaveOutcome === "saved" &&
  acknowledgedForm.value === "category"
    ? "Категория сохранена, но меню не удалось обновить."
    : catalogStore.formSaveOutcome === "saved" &&
        acknowledgedForm.value === "modifier-archive"
      ? "Группа добавок архивирована, но меню не удалось обновить."
      : catalogStore.formSaveOutcome === "saved" &&
          acknowledgedForm.value === "modifier"
        ? "Группа добавок сохранена, но меню не удалось обновить."
        : catalogStore.formSaveOutcome === "saved"
          ? "Товар сохранён, но меню не удалось обновить."
          : hasConfirmedCatalog.value
            ? "Не удалось завершить операцию с меню."
            : "Не удалось загрузить меню.",
);
let recoveringCatalogRead = false;
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();

const orderedCategories = computed(() =>
  [...catalogStore.categories].sort(bySortOrder),
);
const modifierGroups = computed(() => catalogStore.modifierGroups);
const categoryFieldErrors = computed(() => catalogStore.fieldErrors);
const productFieldErrors = computed(() => catalogStore.fieldErrors);
const modifierFieldErrors = computed(() => catalogStore.fieldErrors);

onMounted(async () => {
  await loadCatalog();
  await nextTick();
  const productId =
    typeof route.query.focusProduct === "string"
      ? route.query.focusProduct
      : null;
  const categoryId =
    typeof route.query.focusCategory === "string"
      ? route.query.focusCategory
      : null;
  const target = productId
    ? document.getElementById(`menu-product-${productId}`)
    : null;
  if (target instanceof HTMLElement) target.focus();
  else if (categoryId)
    document.getElementById(`category-toggle-${categoryId}`)?.focus();
});

watch(
  () => catalogStore.status,
  async (status) => {
    if (status === "ready") hasConfirmedCatalog.value = true;
    if (
      status !== "error" ||
      recoveringCatalogRead ||
      catalogStore.error?.status !== 401
    )
      return;

    recoveringCatalogRead = true;
    try {
      await sessionStore.restore();
      const refreshedAccess = accessToken();
      if (refreshedAccess !== null) await catalogStore.refresh(refreshedAccess);
    } finally {
      recoveringCatalogRead = false;
    }
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

async function toggleReorder(): Promise<void> {
  if (reorderPending.value) return;
  if (managementOpen.value) {
    reorderPanel.value?.requestClose();
    return;
  }
  reorderSaved.value = false;
  await setReorderMode(true);
  await nextTick();
  reorderPanel.value?.focusTitle();
  reorderError.value = null;
}

async function closeReorder(): Promise<void> {
  if (reorderPending.value) return;
  await setReorderMode(false);
  await nextTick();
  menuOverview.value?.focusReorderAction();
  reorderError.value = null;
}

async function setReorderMode(open: boolean): Promise<void> {
  const query = { ...route.query };
  if (open) query.mode = "reorder";
  else delete query.mode;
  await router.push({ query });
}

async function saveReorder(scopes: readonly MenuReorderScope[]): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    reorderPending.value ||
    scopes.length === 0
  )
    return;
  reorderPending.value = true;
  reorderError.value = null;
  const confirmed: MenuReorderScope[] = [];
  try {
    for (const scope of scopes) {
      if (scope.categoryId === null)
        await catalogStore.reorderCategories(authorizationValue, scope.ids);
      else
        await catalogStore.reorderProducts(
          authorizationValue,
          scope.categoryId,
          scope.ids,
        );
      if (!catalogStore.lastCommandSucceeded || catalogStore.status !== "ready")
        throw new Error("reorder failed");
      confirmed.push(scope);
    }
    await setReorderMode(false);
    reorderSaved.value = true;
    await nextTick();
    menuOverview.value?.focusReorderAction();
  } catch {
    // Best-effort compensation keeps confirmed server scopes aligned with the original draft.
    for (const scope of confirmed.reverse()) {
      if (scope.categoryId === null)
        await catalogStore.reorderCategories(
          authorizationValue,
          scope.originalIds,
        );
      else
        await catalogStore.reorderProducts(
          authorizationValue,
          scope.categoryId,
          scope.originalIds,
        );
    }
    await catalogStore.refresh(authorizationValue);
    reorderError.value = "Не удалось сохранить порядок. Изменения не потеряны.";
  } finally {
    reorderPending.value = false;
  }
}

function openCategoryEditor(category: Category): void {
  catalogStore.resetFormSaveOutcome();
  acknowledgedForm.value = null;
  categoryRecoveryState.value = "idle";
  categoryArchiveError.value = null;
  selectedCategory.value = category;
  editCategoryOpen.value = true;
}

function openProductEditor(product: Product): void {
  void router.push(`/menu/products/${product.id}/edit`);
}

function openNewProductForm(): void {
  catalogStore.resetFormSaveOutcome();
  acknowledgedForm.value = null;
  productRecoveryState.value = "idle";
  addProductOpen.value = true;
}

function closeNewProductForm(preserveOutcome = false): void {
  if (!preserveOutcome) {
    catalogStore.resetFormSaveOutcome();
    acknowledgedForm.value = null;
  }
  productRecoveryState.value = "idle";
  addProductOpen.value = false;
}

function openModifierGroupEditor(group: ModifierGroup | null): void {
  catalogStore.resetFormSaveOutcome();
  acknowledgedForm.value = null;
  modifierRecoveryState.value = "idle";
  modifierOperationKind.value = null;
  modifierEditorSession.value += 1;
  selectedModifierGroup.value = group;
  modifierGroupEditorOpen.value = true;
}

function closeModifierGroupEditor(preserveOutcome = false): void {
  if (modifierDialogPending.value) return;
  if (!preserveOutcome) {
    catalogStore.resetFormSaveOutcome();
    acknowledgedForm.value = null;
  }
  modifierRecoveryState.value = "idle";
  if (!preserveOutcome) modifierOperationKind.value = null;
  selectedModifierGroup.value = null;
  modifierGroupEditorOpen.value = false;
}

function updateModifierGroupEditorOpen(isOpen: boolean): void {
  if (!isOpen) closeModifierGroupEditor();
}

async function createCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    catalogStore.status === "loading" ||
    categoryRecoveryState.value !== "idle" ||
    catalogStore.formSaveOutcome !== "idle"
  )
    return;
  await catalogStore.createCategory(authorizationValue, {
    ...data,
    sortOrder: nextCategorySortOrder(),
  });
  if (catalogStore.lastCommandSucceeded) {
    acknowledgedForm.value = "category";
    const created = catalogStore.categories.find(
      (category) => category.name === data.name,
    );
    if (created) {
      expandedCategoryIds.value = new Set([
        ...expandedCategoryIds.value,
        created.id,
      ]);
      highlightedCategoryId.value = created.id;
      window.setTimeout(() => {
        if (highlightedCategoryId.value === created.id)
          highlightedCategoryId.value = null;
      }, 2000);
    }
    closeNewCategoryForm(true);
    if (created) {
      await nextTick();
      document.getElementById(`category-toggle-${created.id}`)?.focus();
    }
  }
}

async function updateCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  const category = selectedCategory.value;
  if (
    authorizationValue === null ||
    category === null ||
    catalogStore.status === "loading" ||
    categoryRecoveryState.value !== "idle" ||
    catalogStore.formSaveOutcome !== "idle"
  )
    return;
  await catalogStore.updateCategory(authorizationValue, category.id, {
    ...data,
    sortOrder: category.sortOrder,
  });
  if (catalogStore.lastCommandSucceeded) {
    acknowledgedForm.value = "category";
    closeCategoryEditor(true);
  }
}

function openNewCategoryForm(): void {
  catalogStore.resetFormSaveOutcome();
  acknowledgedForm.value = null;
  categoryRecoveryState.value = "idle";
  addCategoryOpen.value = true;
}

function closeNewCategoryForm(preserveOutcome = false): void {
  if (!preserveOutcome) {
    catalogStore.resetFormSaveOutcome();
    acknowledgedForm.value = null;
  }
  categoryRecoveryState.value = "idle";
  addCategoryOpen.value = false;
}

function closeCategoryEditor(preserveOutcome = false): void {
  if (!preserveOutcome) {
    catalogStore.resetFormSaveOutcome();
    acknowledgedForm.value = null;
  }
  categoryRecoveryState.value = "idle";
  editCategoryOpen.value = false;
  selectedCategory.value = null;
}

async function refreshCategoryCatalog(): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    catalogStore.status === "loading" ||
    categoryRecoveryState.value === "checking" ||
    categoryRecoveryState.value === "checked"
  )
    return;
  categoryRecoveryState.value = "checking";
  await catalogStore.refresh(authorizationValue);
  categoryRecoveryState.value =
    catalogStore.status === "ready" ? "checked" : "retry";
}

async function archiveCategory(categoryId: string): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    categoryArchivePending.value ||
    catalogStore.status === "loading"
  )
    return;
  const categoryIndex = orderedCategories.value.findIndex(
    (category) => category.id === categoryId,
  );
  const adjacentCategoryId =
    orderedCategories.value[categoryIndex + 1]?.id ??
    orderedCategories.value[categoryIndex - 1]?.id ??
    null;
  categoryArchivePending.value = true;
  categoryArchiveError.value = null;
  await catalogStore.archiveCategory(authorizationValue, categoryId);
  categoryArchivePending.value = false;
  if (catalogStore.lastCommandSucceeded) {
    selectedCategory.value = null;
    closeCategoryEditor(true);
    await nextTick();
    if (adjacentCategoryId) {
      document.getElementById(`category-toggle-${adjacentCategoryId}`)?.focus();
    } else {
      menuOverview.value?.focusAddCategoryAction();
    }
  } else {
    categoryArchiveError.value =
      "Не удалось архивировать категорию. Повторите попытку.";
  }
}

async function createProduct(data: CreateProductFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    catalogStore.status === "loading" ||
    productRecoveryState.value === "checked"
  )
    return;
  await catalogStore.createProduct(authorizationValue, {
    ...data,
    sortOrder: nextProductSortOrder(data.categoryId),
  });
  if (catalogStore.lastCommandSucceeded) {
    acknowledgedForm.value = "product";
    closeNewProductForm(true);
  }
}

async function refreshProductCatalog(): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    catalogStore.status === "loading" ||
    productRecoveryState.value === "checking" ||
    productRecoveryState.value === "checked"
  )
    return;
  productRecoveryState.value = "checking";
  await catalogStore.refresh(authorizationValue);
  productRecoveryState.value =
    catalogStore.status === "ready" ? "checked" : "retry";
}

async function saveModifierGroup(data: ModifierGroupFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    modifierDialogPending.value ||
    modifierRecoveryState.value !== "idle" ||
    (catalogStore.formSaveOutcome !== "idle" &&
      (catalogStore.formSaveOutcome !== "rejected" ||
        modifierOperationKind.value === "archive"))
  )
    return;
  modifierSaveInFlight.value = true;
  modifierOperationKind.value = "save";
  try {
    await catalogStore.saveModifierGroup(authorizationValue, data);
    if (catalogStore.lastCommandSucceeded) {
      acknowledgedForm.value = "modifier";
      closeModifierGroupEditor(true);
    }
  } finally {
    modifierSaveInFlight.value = false;
  }
}

async function refreshModifierGroupCatalog(): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    modifierDialogPending.value ||
    modifierRecoveryState.value === "checked"
  )
    return;
  modifierRecoveryState.value = "checking";
  await catalogStore.refresh(authorizationValue);
  modifierRecoveryState.value =
    catalogStore.status === "ready" ? "checked" : "retry";
}

async function archiveModifierGroup(groupId: string): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    modifierDialogPending.value ||
    modifierFormSaveOutcome.value !== "idle"
  )
    return;
  modifierOperationKind.value = "archive";
  modifierSaveInFlight.value = true;
  try {
    await catalogStore.archiveModifierGroup(authorizationValue, groupId);
    if (catalogStore.lastCommandSucceeded) {
      acknowledgedForm.value = "modifier-archive";
      closeModifierGroupEditor(true);
    }
  } finally {
    modifierSaveInFlight.value = false;
  }
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
  background: var(--expressa-color-surface-raised);
}

:deep(.page-shell-description) {
  display: none;
}

.menu-page__catalog-summary {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
}

.menu-page__management-toggle {
  min-height: 44px;
  margin-inline-start: auto;
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
  flex-wrap: wrap;
}

.menu-page__catalog-summary {
  flex: 1 1 12rem;
}

.menu-page__management-explanation {
  max-width: 60rem;
  margin: 0;
  color: var(--expressa-color-text-secondary);
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
  min-inline-size: 0;
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
  overflow-wrap: anywhere;
  white-space: normal;
}

.menu-page__editor-section h3,
.menu-page__assignments h3 {
  overflow-wrap: anywhere;
  white-space: normal;
}

.menu-page__state {
  margin: 0;
  color: var(--expressa-color-text-muted);
}

.menu-page__error {
  color: var(--expressa-color-status-error);
  margin-block-end: var(--expressa-space-md);
}

.menu-page__error p {
  margin: 0;
}

.menu-page__error-details {
  overflow-wrap: anywhere;
}

@media (min-width: 768px) {
  .menu-page__error-recovery {
    justify-self: start;
    width: fit-content;
  }
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

@media (max-width: 40rem) {
  .menu-page__catalog-tools {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 768px) {
  .menu-page__shell {
    padding: 21px var(--expressa-space-lg) var(--expressa-space-lg);
    background: var(--expressa-color-surface);
  }

  :deep(.page-shell-title) {
    margin: 0;
    font-size: var(--expressa-font-size-screen-title);
  }

  :deep(.page-shell-content) {
    margin-top: var(--expressa-space-md);
  }
}
</style>
