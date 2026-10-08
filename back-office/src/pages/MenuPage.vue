<template>
  <PageShell class="menu-page__shell" content-spacing="none">
    <MenuScreenHeading />
    <p
      v-if="
        catalogStore.status === 'loading' &&
        modifierPendingMessage === null &&
        !reorderPending
      "
      class="menu-page__state"
    >
      Загружаем меню…
    </p>
    <template v-if="hasConfirmedCatalog">
      <div :inert="isBusy" class="menu-page__content">
        <MenuOverview
          v-if="!managementOpen"
          :categories="orderedCategories"
          :expanded-category-ids="expandedCategoryIds"
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
          @cancel="closeReorder"
          @navigate="router.push($event)"
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
      @cancel="closeNewCategoryForm"
      @confirm="createCategory"
    />
    <EditCategoryDialog
      v-model:open="editCategoryOpen"
      :archive-pending="categoryArchivePending"
      :categories="orderedCategories"
      :disabled="isBusy"
      :category="selectedCategory"
      :field-errors="categoryFieldErrors"
      @archive="archiveCategory"
      @cancel="closeCategoryEditor"
      @save="updateCategory"
    />
    <AddProductDialog
      v-model:open="addProductOpen"
      :disabled="isBusy"
      :categories="orderedCategories"
      :field-errors="productFieldErrors"
      @cancel="closeNewProductForm"
      @confirm="createProduct"
    />
    <AdminDialog
      cancel-label="Отмена"
      :destructive-label="
        selectedModifierGroup !== null ? 'В архив' : undefined
      "
      :destructive-disabled="modifierArchiveDisabled"
      :dismiss-disabled="modifierDialogPending"
      :model-value="modifierGroupEditorOpen"
      max-width="800"
      :pending="modifierDialogPending"
      :submit-disabled="modifierSubmitDisabled"
      submit-form="modifier-group-editor-form"
      submit-label="Сохранить"
      title="Группа добавок"
      @destructive="openModifierArchiveConfirmation"
      @update:model-value="updateModifierGroupEditorOpen"
    >
      <ModifierGroupEditor
        :key="modifierEditorSession"
        embedded
        form-id="modifier-group-editor-form"
        :disabled="modifierDialogPending"
        :field-errors="modifierFieldErrors"
        :group="selectedModifierGroup"
        :pending-message="modifierPendingMessage"
        :operation-kind="modifierOperationKind"
        :save-outcome="modifierFormSaveOutcome"
        @archive="archiveModifierGroup"
        @cancel="closeModifierGroupEditor"
        @save="saveModifierGroup"
        @refresh="refreshModifierGroupCatalog"
      />
    </AdminDialog>
    <ConfirmDialog
      v-model:open="modifierArchiveOpen"
      :pending="modifierDialogPending"
      confirm-label="Архивировать"
      confirm-variant="destructive"
      description="Группа добавок больше не будет доступна для назначения."
      title="Архивировать группу добавок?"
      @confirm="confirmModifierArchive"
    />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from "vue-router";

import { useSessionStore } from "../app/session.store";
import AddCategoryDialog from "./admin/menu/AddCategoryDialog.vue";
import type { CategoryFormData } from "./admin/menu/AddCategoryDialog.types";
import AddProductDialog from "./admin/menu/AddProductDialog.vue";
import type { CreateProductFormData } from "./admin/menu/AddProductDialog.types";
import EditCategoryDialog from "./admin/menu/EditCategoryDialog.vue";
import MenuReorderPanel from "./admin/menu/MenuReorderPanel.vue";
import MenuOverview from "./admin/menu/MenuOverview.vue";
import MenuScreenHeading from "./admin/menu/MenuScreenHeading.vue";
import type { MenuReorderScope } from "./admin/menu/composables/useMenuReorderDraft.types";
import ModifierGroupEditor from "./admin/menu/ModifierGroupEditor.vue";
import type { ModifierGroupFormData } from "./admin/menu/ModifierGroupEditor.types";
import { catalogContext, useCatalogStore } from "./admin/menu/catalog.store";
import type {
  Category,
  ModifierGroup,
  Product,
} from "./admin/menu/catalog.types";
import AdminDialog from "../shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import PageShell from "./PageShell.vue";
import { getOperationPort } from "../shared/lib/operations/operation-port";

const sessionStore = useSessionStore();
const route = useRoute();
const router = useRouter();
const catalogStore = useCatalogStore();
const modifierOwnerPrefix = crypto.randomUUID();
let modifierOwnerActive = true;
let disposeModifierRecovery: (() => void) | null = null;
onBeforeUnmount(() => {
  modifierOwnerActive = false;
  disposeModifierRecovery?.();
});
const addCategoryOpen = shallowRef(false);
const addProductOpen = shallowRef(false);
const editCategoryOpen = shallowRef(false);
const modifierGroupEditorOpen = shallowRef(false);
const modifierArchiveOpen = shallowRef(false);
const modifierEditorSession = shallowRef(0);
const expandedCategoryIds = shallowRef<ReadonlySet<string>>(new Set());
const managementOpen = computed(() => route.query.mode === "reorder");
const reorderPending = shallowRef(false);
const trustedReorderExit = shallowRef<string | null>(null);
const reorderSaved = shallowRef(false);
const reorderPanel = shallowRef<{
  requestClose: () => void;
  requestNavigation: (target: string) => boolean;
  confirmSaved: () => void;
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
const modifierSubmitDisabled = computed(
  () =>
    accessToken() === null ||
    modifierDialogPending.value ||
    modifierRecoveryState.value !== "idle" ||
    (catalogStore.formSaveOutcome !== "idle" &&
      (catalogStore.formSaveOutcome !== "rejected" ||
        modifierOperationKind.value === "archive")),
);
const modifierArchiveDisabled = computed(
  () =>
    accessToken() === null ||
    modifierDialogPending.value ||
    modifierFormSaveOutcome.value !== "idle",
);
const modifierPendingMessage = computed<string | null>(() => {
  if (modifierRecoveryState.value === "checking")
    return "Проверяем актуальное меню…";
  if (!modifierSaveInFlight.value) return null;
  if (catalogStore.formSaveOutcome === "saved") return "Обновляем меню…";
  return modifierOperationKind.value === "archive"
    ? "Архивируем группу…"
    : "Сохраняем группу…";
});

const orderedCategories = computed(() =>
  [...catalogStore.categories].sort(bySortOrder),
);
const modifierGroups = computed(() => catalogStore.modifierGroups);
const categoryFieldErrors = computed(() => catalogStore.fieldErrors);
const productFieldErrors = computed(() => catalogStore.fieldErrors);
const modifierFieldErrors = computed(() => catalogStore.fieldErrors);

onMounted(loadCatalog);

onBeforeRouteLeave((to) => {
  if (reorderPending.value) return false;
  return reorderPanel.value?.requestNavigation(to.fullPath) ?? true;
});
onBeforeRouteUpdate((to) => {
  if (reorderPending.value) return to.fullPath === trustedReorderExit.value;
  return to.query.mode !== "reorder"
    ? (reorderPanel.value?.requestNavigation(to.fullPath) ?? true)
    : true;
});

watch(
  () => catalogStore.status,
  async (status) => {
    if (status === "ready") hasConfirmedCatalog.value = true;
  },
);

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
}

async function closeReorder(): Promise<void> {
  if (reorderPending.value) return;
  await setReorderMode(false);
}

async function setReorderMode(open: boolean, trusted = false): Promise<void> {
  const query = { ...route.query };
  if (open) query.mode = "reorder";
  else delete query.mode;
  const target = { query };
  if (trusted) trustedReorderExit.value = router.resolve(target).fullPath;
  try {
    await router.push(target);
  } finally {
    if (trusted) trustedReorderExit.value = null;
  }
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
    reorderPanel.value?.confirmSaved();
    await setReorderMode(false, true);
    reorderSaved.value = true;
  } catch {
    // Best-effort compensation keeps confirmed server scopes aligned with the original draft.
    for (const scope of confirmed.reverse()) {
      if (scope.categoryId === null)
        await catalogStore.reorderCategories(
          authorizationValue,
          scope.originalIds,
          "compensate",
        );
      else
        await catalogStore.reorderProducts(
          authorizationValue,
          scope.categoryId,
          scope.originalIds,
          "compensate",
        );
    }
    await catalogStore.refresh(authorizationValue);
  } finally {
    reorderPending.value = false;
  }
}

function openCategoryEditor(category: Category): void {
  catalogStore.resetFormSaveOutcome();
  acknowledgedForm.value = null;
  categoryRecoveryState.value = "idle";
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
  disposeModifierRecovery?.();
  disposeModifierRecovery = null;
  modifierArchiveOpen.value = false;
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
  disposeModifierRecovery?.();
  disposeModifierRecovery = null;
  modifierArchiveOpen.value = false;
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

function openModifierArchiveConfirmation(): void {
  if (selectedModifierGroup.value === null || modifierArchiveDisabled.value)
    return;
  modifierArchiveOpen.value = true;
}

async function confirmModifierArchive(): Promise<void> {
  const group = selectedModifierGroup.value;
  if (group === null || modifierArchiveDisabled.value) return;
  modifierArchiveOpen.value = false;
  await archiveModifierGroup(group.id);
}

async function createCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    catalogStore.status === "loading" ||
    categoryRecoveryState.value !== "idle"
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
    }
    closeNewCategoryForm(true);
  }
}

async function updateCategory(data: CategoryFormData): Promise<void> {
  const authorizationValue = accessToken();
  const category = selectedCategory.value;
  if (
    authorizationValue === null ||
    category === null ||
    catalogStore.status === "loading" ||
    categoryRecoveryState.value !== "idle"
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

async function archiveCategory(categoryId: string): Promise<void> {
  const authorizationValue = accessToken();
  if (
    authorizationValue === null ||
    categoryArchivePending.value ||
    catalogStore.status === "loading"
  )
    return;
  categoryArchivePending.value = true;
  await catalogStore.archiveCategory(authorizationValue, categoryId);
  categoryArchivePending.value = false;
  if (catalogStore.lastCommandSucceeded) {
    selectedCategory.value = null;
    closeCategoryEditor(true);
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

function modifierOperationOwner() {
  const editorSession = modifierEditorSession.value;
  return {
    ownerIdentity: `${modifierOwnerPrefix}:${editorSession}`,
    ownerIsActive: () =>
      modifierOwnerActive &&
      modifierGroupEditorOpen.value &&
      modifierEditorSession.value === editorSession,
  };
}

function registerModifierRecovery(
  operationKey: string,
  resourceKey: string,
): void {
  disposeModifierRecovery?.();
  disposeModifierRecovery = getOperationPort().registerRecovery(
    {
      ...catalogContext("catalog.form.save", "catalog", "mutation"),
      requestTarget: { operationKey, resourceKey },
      ...modifierOperationOwner(),
    },
    {
      actionLabel: "Обновить меню",
      safety: "reconciledMutation",
      async execute() {
        await refreshModifierGroupCatalog();
        return modifierRecoveryState.value === "checked"
          ? { status: "success", value: undefined }
          : { status: "cancelled" };
      },
    },
  );
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
  registerModifierRecovery("catalog.modifierGroup.save", data.id ?? "new");
  try {
    await catalogStore.saveModifierGroup(
      authorizationValue,
      data,
      modifierOperationOwner(),
    );
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
    catalogStore.status === "ready" && catalogStore.lastCommandSucceeded
      ? "checked"
      : "retry";
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
  registerModifierRecovery("catalog.modifierGroup.archive", groupId);
  modifierSaveInFlight.value = true;
  try {
    await catalogStore.archiveModifierGroup(
      authorizationValue,
      groupId,
      modifierOperationOwner(),
    );
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

.menu-page__management-toggle {
  min-height: var(--expressa-size-control-min-height);
  margin-inline-start: auto;
}

.menu-page__management-icon,
.menu-page__option-chevron,
.menu-page__option-edit-icon {
  width: var(--expressa-size-icon-action);
  height: var(--expressa-size-icon-action);
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

.menu-page__section {
  gap: var(--expressa-space-control-inline);
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
  min-height: var(--expressa-size-row-min);
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
  padding: var(--expressa-space-control-block) var(--expressa-space-md);
  text-align: left;
}

.menu-page__option-copy,
.menu-page__option-row-copy {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-2xs);
}

.menu-page__option-chevron {
  flex: 0 0 var(--expressa-size-icon-action);
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
  width: var(--expressa-size-control-min-height);
  min-width: var(--expressa-size-control-min-height);
  place-items: center;
  padding: 0;
  color: var(--expressa-color-accent);
}

.menu-page__option-row {
  width: 100%;
  min-height: var(--expressa-size-row-min);
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-control-block) var(--expressa-space-md)
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

@media (min-width: 768px) {
  .menu-page__error-recovery {
    justify-self: start;
    width: fit-content;
  }
}

@media (max-width: 767px) {
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
    padding: var(--expressa-space-lg);
    background: var(--expressa-color-surface);
  }
}
</style>
