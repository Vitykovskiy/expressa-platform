<template>
  <main class="catalog-page">
    <div v-if="navigationError" class="catalog-page__feedback">
      <p role="alert">{{ navigationError }}</p>
      <UiButton variant="secondary" @activate="emit('resetAddress')"
        >Исправить адрес</UiButton
      >
    </div>
    <template v-else>
      <p v-if="initialLoading" role="status">Загружаем каталог</p>
      <div v-if="readFailure" class="catalog-page__feedback">
        <p role="alert">{{ catalog.error }}</p>
        <UiButton
          variant="secondary"
          :loading="catalog.loading"
          :disabled="session.busy"
          @activate="catalog.refresh"
          >Повторить</UiButton
        >
      </div>
      <CatalogOperation
        v-if="pageOperation"
        :operation="pageOperation"
        :disabled="session.busy"
        :refresh-loading="catalog.loading"
        @reconcile="catalog.reconcile"
        @refresh="catalog.refresh"
        @leave="leaveTask"
        @restart="catalog.restartReorder"
      />
      <template v-if="catalog.data">
        <UiFilterGroup
          :model-value="mode"
          label="Каталог"
          :options="catalogModes"
          :disabled="modeDisabled"
          @update:model-value="changeMode"
        />
        <ModifierReorder
          v-if="modifierReorderTask"
          :name="modifierReorderTask.baseline.name"
          :options="reorderOptions"
          :current="currentReorderGroup"
          :reconciled="reconciled"
          :active="active && !navigationError"
          :dirty="catalog.dirty"
          :read-only="catalog.locked"
          :disabled="mutationDisabled"
          :busy="sending"
          :attempting="attempting"
          @move="catalog.moveModifierOrder"
          @save="catalog.saveModifier()"
          @cancel="cancelModifierTask"
        />
        <ModifierWorkspace
          v-else-if="modifierMode"
          :data="catalog.data"
          :task="catalog.modifierTask"
          :errors="catalog.modifierErrors"
          :error-focus="catalog.modifierErrorFocus"
          :search="modifierSearch"
          :active="active && !navigationError"
          :loading="catalog.loading"
          :disabled="session.busy"
          :mutation-disabled="mutationDisabled"
          :read-only="catalog.locked"
          :dirty="catalog.dirty"
          :busy="sending"
          :attempting="attempting"
          :reconciled="reconciled"
          :confirming="
            Boolean(catalog.modifierOmissionConfirmation) || modifierArchiveOpen
          "
          :show-refresh="showRefresh"
          @search="modifierSearch = $event"
          @refresh="catalog.refresh"
          @create="beginModifierCreate"
          @select="beginModifierEdit"
          @reorder="beginModifierReorder"
          @draft="catalog.editModifierDraft"
          @validate="catalog.validateModifier"
          @add="catalog.addModifierOption"
          @remove="catalog.removeModifierOption"
          @restore="catalog.restoreModifierOption"
          @move="catalog.moveModifierOption"
          @save="catalog.saveModifier()"
          @cancel="cancelModifierTask"
          @archive="modifierArchiveOpen = true"
        />
        <ProductReorder
          v-else-if="productReorderTask"
          :products="reorderProducts"
          :category-name="productReorderTask.category.name"
          :dirty="catalog.dirty"
          :read-only="catalog.locked"
          :disabled="mutationDisabled"
          :busy="sending"
          :attempting="attempting"
          @move="catalog.moveProduct"
          @save="catalog.saveProduct()"
          @cancel="cancelProductTask"
        />
        <ProductWorkspace
          v-else-if="productMode"
          :data="catalog.data"
          :task="catalog.productTask"
          :errors="catalog.productErrors"
          :search="productSearch"
          :category-id="productCategoryId"
          :loading="catalog.loading"
          :disabled="session.busy"
          :mutation-disabled="mutationDisabled"
          :read-only="catalog.locked"
          :dirty="catalog.dirty"
          :busy="sending"
          :attempting="attempting"
          :reconciled="reconciled"
          :confirming="Boolean(catalog.omissionConfirmation)"
          :show-refresh="showRefresh"
          @search="productSearch = $event"
          @category="productCategoryId = $event"
          @refresh="catalog.refresh"
          @create="beginProductCreate"
          @select="beginProductEdit"
          @reorder="beginProductReorder"
          @draft="catalog.editProductDraft"
          @mode="catalog.setProductMode"
          @add-choice="catalog.addChoice"
          @remove-choice="catalog.removeChoice"
          @restore-choice="catalog.restoreChoice"
          @move-choice="catalog.moveChoice"
          @save="catalog.saveProduct()"
          @cancel="cancelProductTask"
          @archive="productArchiveOpen = true"
        />
        <CategoryReorder
          v-else-if="reorderTask"
          :categories="reorderCategories"
          :dirty="catalog.dirty"
          :read-only="catalog.locked"
          :disabled="mutationDisabled"
          :busy="sending"
          :attempting="attempting"
          @move="catalog.move"
          @save="catalog.save"
          @cancel="cancelTask"
        />
        <div v-else class="catalog-page__workspace" :class="workspaceClass">
          <section class="catalog-page__list">
            <div class="catalog-page__heading">
              <h2
                id="category-list-heading"
                class="foundation-section-title"
                tabindex="-1"
              >
                Категории
              </h2>
              <UiButton
                v-if="!catalog.task"
                :disabled="mutationDisabled"
                @activate="beginCreate"
                >Добавить категорию</UiButton
              >
            </div>
            <CategorySearch
              :search="search"
              :loading="catalog.loading"
              :disabled="session.busy"
              :show-refresh="showRefresh"
              @search="search = $event"
              @refresh="catalog.refresh"
            />
            <UiButton
              v-if="canReorder"
              class="catalog-page__reorder-entry"
              variant="quiet"
              :disabled="mutationDisabled"
              @activate="beginReorder"
              >Изменить порядок</UiButton
            >
            <div
              v-if="visibleCategories.length === 0"
              class="catalog-page__feedback"
            >
              <p>{{ filtered ? "Ничего не найдено" : "Категорий пока нет" }}</p>
              <UiButton v-if="filtered" variant="quiet" @activate="search = ''"
                >Сбросить поиск</UiButton
              >
            </div>
            <CategoryList
              v-else
              :categories="visibleCategories"
              :selected-id="selectedId"
              :disabled="selectionDisabled"
              @select="beginEdit"
              @associations="beginAssociations"
            />
          </section>
          <section v-if="associationTask" class="catalog-page__editor">
            <CategoryGroupAssignment
              :task="associationTask"
              :groups="catalog.data.modifierGroups"
              :errors="catalog.associationErrors"
              :disabled="mutationDisabled"
              :read-only="catalog.locked"
              :active="associationActive"
              :confirming="associationConfirmationOpen"
              :attempting="attempting"
              @add="catalog.addAssociation"
              @remove="catalog.removeAssociation"
              @move="catalog.moveAssociation"
              @save="catalog.requestAssociationSave"
              @cancel="cancelAssociationTask"
            />
            <AssociationCurrent
              v-if="reconciled"
              :data="catalog.data"
              :category-id="associationTask.baseline.category.id"
            />
          </section>
          <section v-else-if="formTask" class="catalog-page__editor">
            <CategoryForm
              :draft="formTask.draft"
              :errors="catalog.errors"
              :title="formTitle"
              :creating="formTask.kind === 'create'"
              :read-only="catalog.locked"
              :disabled="session.busy"
              :mutation-disabled="mutationDisabled"
              :dirty="catalog.dirty"
              :busy="sending"
              :attempting="attempting"
              :can-archive="canArchive"
              @draft="catalog.editDraft"
              @save="catalog.save"
              @cancel="cancelTask"
              @archive="archiveOpen = true"
            />
            <div v-if="showCurrentCategory" class="catalog-page__feedback">
              <h3>Текущая категория</h3>
              <template v-if="currentCategory">
                <p>{{ currentCategory.name }}</p>
                <p class="catalog-page__description">
                  {{ currentCategory.description }}
                </p>
                <p>
                  {{ currentCategory.isActive ? "Активна" : "Неактивна" }} ·
                  Порядок {{ currentCategory.sortOrder }}
                </p>
              </template>
              <p v-else>Категория недоступна</p>
            </div>
          </section>
        </div>
      </template>
      <AssociationConfirmation
        :open="associationConfirmationOpen"
        :intent="catalog.associationConfirmation?.intent ?? null"
        :disabled="mutationDisabled"
        @cancel="catalog.cancelAssociationConfirmation"
        @confirm="confirmAssociationSave"
      />
      <UiDialog
        :open="modifierOmissionsOpen"
        title="Архивировать добавки?"
        @update:open="catalog.cancelModifierOmissions"
      >
        <p>{{ modifierTitle }}</p>
        <ul class="catalog-page__omissions">
          <li
            v-for="option in catalog.modifierOmissionConfirmation?.options"
            :key="option.id"
          >
            {{ option.name }}
          </li>
        </ul>
        <p>
          Эти добавки исчезнут из текущего каталога после сохранения группы.
        </p>
        <template #actions>
          <UiButton
            variant="secondary"
            @activate="catalog.cancelModifierOmissions"
            >Отменить</UiButton
          >
          <UiButton
            variant="danger"
            :disabled="mutationDisabled"
            @activate="catalog.confirmModifierOmissions"
            >Сохранить изменения</UiButton
          >
        </template>
      </UiDialog>
      <ModifierArchive
        :open="modifierArchiveOpen"
        :name="modifierTitle"
        :operation="modifierArchiveOperation"
        :disabled="session.busy"
        :confirm-disabled="mutationDisabled"
        @close="modifierArchiveOpen = false"
        @confirm="catalog.archiveModifier"
        @reconcile="catalog.reconcile"
        @refresh="catalog.refresh"
        @leave="leaveTask"
      />
      <UiDialog
        :open="omissionsOpen"
        title="Архивировать ценовые опции?"
        @update:open="catalog.cancelProductOmissions"
      >
        <p>{{ productTitle }}</p>
        <ul class="catalog-page__omissions">
          <li
            v-for="choice in catalog.omissionConfirmation?.choices"
            :key="choice.id"
          >
            {{ choice.portionLabel }}
          </li>
        </ul>
        <p>Эти опции исчезнут из текущего каталога после сохранения товара.</p>
        <template #actions>
          <UiButton
            variant="secondary"
            @activate="catalog.cancelProductOmissions"
            >Отменить</UiButton
          >
          <UiButton
            variant="danger"
            :disabled="mutationDisabled"
            @activate="catalog.confirmProductOmissions"
            >Сохранить изменения</UiButton
          >
        </template>
      </UiDialog>
      <ProductArchive
        :open="productArchiveOpen"
        :product="archiveProduct"
        :category-name="archiveProductCategoryName"
        :operation="productArchiveOperation"
        :disabled="session.busy"
        :confirm-disabled="mutationDisabled"
        @close="productArchiveOpen = false"
        @confirm="catalog.archiveProduct"
        @reconcile="catalog.reconcile"
        @refresh="catalog.refresh"
        @leave="leaveTask"
      />
      <CategoryArchive
        :open="archiveOpen"
        :name="archiveName"
        :operation="archiveOperation"
        :disabled="session.busy"
        :confirm-disabled="mutationDisabled"
        @close="archiveOpen = false"
        @confirm="catalog.archive"
        @reconcile="catalog.reconcile"
        @refresh="catalog.refresh"
        @leave="leaveTask"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { useCatalogStore } from "../entities/catalog/catalog.store";
import { useSessionStore } from "../entities/session/session.store";
import ProductWorkspace from "../widgets/catalog/ProductWorkspace.vue";
import ProductReorder from "../features/product-reorder/ProductReorder.vue";
import ProductArchive from "../features/product-archive/ProductArchive.vue";
import UiFilterGroup from "../shared/ui/UiFilterGroup/UiFilterGroup.vue";
import UiDialog from "../shared/ui/UiDialog/UiDialog.vue";
import { catalogModes } from "./CatalogPage.constants";
import CategoryForm from "../features/category-edit/CategoryForm.vue";
import CatalogOperation from "../widgets/catalog/CatalogOperation.vue";
import { modifierAggregate } from "../entities/catalog/modifier.mapper";
import ModifierWorkspace from "../widgets/catalog/ModifierWorkspace.vue";
import ModifierReorder from "../features/modifier-option-reorder/ModifierReorder.vue";
import ModifierArchive from "../features/modifier-group-archive/ModifierArchive.vue";
import CategorySearch from "../features/category-search/CategorySearch.vue";
import CategoryReorder from "../features/category-reorder/CategoryReorder.vue";
import CategoryArchive from "../features/category-archive/CategoryArchive.vue";
import CategoryList from "../widgets/catalog/CategoryList.vue";
import UiButton from "../shared/ui/UiButton/UiButton.vue";
import type { CatalogPageEmits, CatalogPageProps } from "./CatalogPage.types";
import CategoryGroupAssignment from "../features/category-group-assignment/CategoryGroupAssignment.vue";
import AssociationConfirmation from "../features/category-group-assignment/AssociationConfirmation.vue";
import AssociationCurrent from "../widgets/catalog/AssociationCurrent.vue";

const props = defineProps<CatalogPageProps>();
const emit = defineEmits<CatalogPageEmits>();
const catalog = useCatalogStore();
const session = useSessionStore();
const sending = computed(() => catalog.operation?.status === "sending");
const attempting = computed(
  () => catalog.operation?.status === "checking" || sending.value,
);
const active = ref(false);
const search = ref("");
const archiveOpen = ref(false);
const productArchiveOpen = ref(false);
const mode = ref("categories");
const modifierArchiveOpen = ref(false);
const modifierSearch = ref("");
const modifierMode = computed(() => mode.value === "modifiers");
const modifierFormTask = computed(() =>
  catalog.modifierTask !== null &&
  catalog.modifierTask.kind !== "modifier-reorder"
    ? catalog.modifierTask
    : null,
);
const modifierReorderTask = computed(() =>
  catalog.modifierTask?.kind === "modifier-reorder"
    ? catalog.modifierTask
    : null,
);
const currentReorderGroup = computed(() =>
  modifierReorderTask.value && catalog.data
    ? modifierAggregate(catalog.data, modifierReorderTask.value.baseline.id)
    : null,
);
const modifierTitle = computed(() =>
  modifierFormTask.value?.kind === "modifier-edit"
    ? modifierFormTask.value.baseline.name
    : "Новая группа",
);
const selectedModifierId = computed(() =>
  modifierFormTask.value?.kind === "modifier-edit"
    ? modifierFormTask.value.baseline.id
    : null,
);
const reorderOptions = computed(
  () =>
    modifierReorderTask.value?.ids.flatMap(
      (id) =>
        modifierReorderTask.value?.baseline.options.filter(
          (item) => item.id === id,
        ) ?? [],
    ) ?? [],
);
const modifierOmissionsOpen = computed(
  () => active.value && catalog.modifierOmissionConfirmation !== null,
);
const modifierArchiveOperation = computed(() =>
  catalog.operation?.intent.kind === "modifier-archive" &&
  catalog.operation.status !== "abandoned"
    ? catalog.operation
    : null,
);
const productSearch = ref("");
const productCategoryId = ref("");
const productMode = computed(() => mode.value === "products");
const modeDisabled = computed(
  () => session.busy || catalog.task !== null || catalog.locked,
);
const productFormTask = computed(() =>
  catalog.productTask !== null && catalog.productTask.kind !== "product-reorder"
    ? catalog.productTask
    : null,
);
const productReorderTask = computed(() =>
  catalog.productTask?.kind === "product-reorder" ? catalog.productTask : null,
);
const productTitle = computed(() =>
  productFormTask.value?.kind === "product-edit"
    ? productFormTask.value.baseline.name
    : "Новый товар",
);
const selectedProductId = computed(() =>
  productFormTask.value?.kind === "product-edit"
    ? productFormTask.value.baseline.id
    : null,
);
const reorderProducts = computed(
  () =>
    productReorderTask.value?.ids.flatMap(
      (id) =>
        productReorderTask.value?.baseline.filter((item) => item.id === id) ??
        [],
    ) ?? [],
);
const omissionsOpen = computed(
  () => active.value && catalog.omissionConfirmation !== null,
);
const productArchiveOperation = computed(() =>
  catalog.operation?.intent.kind === "product-archive" &&
  catalog.operation.status !== "abandoned"
    ? catalog.operation
    : null,
);
const archiveProduct = computed(() =>
  productArchiveOperation.value?.intent.kind === "product-archive"
    ? productArchiveOperation.value.intent.baseline
    : productFormTask.value?.kind === "product-edit"
      ? productFormTask.value.baseline
      : null,
);
const archiveProductCategoryName = computed(
  () =>
    catalog.data?.categories.find(
      (item) => item.id === archiveProduct.value?.categoryId,
    )?.name ?? "",
);
const formTask = computed(() =>
  catalog.categoryTask !== null && catalog.categoryTask.kind !== "reorder"
    ? catalog.categoryTask
    : null,
);
const reorderTask = computed(() =>
  catalog.categoryTask?.kind === "reorder" ? catalog.categoryTask : null,
);
const associationTask = computed(() => catalog.associationTask);
const associationActive = computed(
  () => active.value && props.navigationError === "",
);
const associationConfirmationOpen = computed(
  () => associationActive.value && catalog.associationConfirmation !== null,
);
const filtered = computed(() => search.value.trim() !== "");
const visibleCategories = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("ru-RU");

  return (
    catalog.data?.categories.filter((category) =>
      `${category.name}\n${category.description}`
        .toLocaleLowerCase("ru-RU")
        .includes(query),
    ) ?? []
  );
});
const selectedId = computed(
  () =>
    associationTask.value?.baseline.category.id ??
    (formTask.value?.kind === "edit" ? formTask.value.baseline.id : null),
);
const reorderCategories = computed(() => {
  const current = reorderTask.value;

  return current === null
    ? []
    : current.ids.flatMap((id) =>
        current.baseline.filter((category) => category.id === id),
      );
});
const mutationDisabled = computed(
  () =>
    !active.value ||
    props.navigationError !== "" ||
    session.busy ||
    catalog.locked ||
    !catalog.fresh,
);
const selectionDisabled = computed(
  () => mutationDisabled.value || catalog.task !== null,
);
const canReorder = computed(
  () => catalog.task === null && (catalog.data?.categories.length ?? 0) > 1,
);
const canArchive = computed(
  () =>
    formTask.value?.kind === "edit" &&
    !catalog.dirty &&
    !mutationDisabled.value,
);
const formTitle = computed(() =>
  formTask.value?.kind === "edit"
    ? formTask.value.baseline.name
    : "Новая категория",
);
const initialLoading = computed(
  () => catalog.data === null && catalog.error === "",
);
const readFailure = computed(
  () =>
    catalog.error !== "" &&
    !catalog.locked &&
    catalog.operation?.status !== "rejected",
);
const archiveOperation = computed(() =>
  catalog.operation?.intent.kind === "archive" &&
  catalog.operation.status !== "abandoned"
    ? catalog.operation
    : null,
);
const archiveName = computed(
  () =>
    archiveOperation.value?.intent.label ??
    (formTask.value?.kind === "edit" ? formTask.value.baseline.name : ""),
);
const pageOperation = computed(() =>
  catalog.operation !== null &&
  catalog.operation.status !== "abandoned" &&
  !archiveOpen.value &&
  !modifierArchiveOpen.value &&
  !productArchiveOpen.value
    ? catalog.operation
    : null,
);
const showRefresh = computed(
  () =>
    !catalog.locked &&
    !readFailure.value &&
    catalog.operation?.status !== "rejected",
);
const reconciled = computed(
  () =>
    catalog.operation?.status === "reconciled" ||
    catalog.operation?.status === "reconciled_ambiguous_create",
);
const workspaceClass = computed(() => ({
  "catalog-page__workspace--editing":
    formTask.value !== null || associationTask.value !== null,
  "catalog-page__workspace--associations": associationTask.value !== null,
  "catalog-page__workspace--current": reconciled.value,
}));
const showCurrentCategory = computed(
  () => selectedId.value !== null && reconciled.value,
);
const currentCategory = computed(
  () =>
    catalog.data?.categories.find(
      (category) => category.id === selectedId.value,
    ) ?? null,
);

async function focusHeading(id: string) {
  await nextTick();
  if (active.value) document.getElementById(id)?.focus({ preventScroll: true });
}

function changeMode(value: string) {
  if (
    !modeDisabled.value &&
    (value === "categories" || value === "products" || value === "modifiers")
  )
    mode.value = value;
}

function beginProductCreate() {
  catalog.beginProductCreate(productCategoryId.value);
  void focusHeading("product-form-heading");
}

async function focusModifierEntry(
  task: typeof catalog.modifierTask,
  origin: Element | null,
  heading: string,
) {
  await nextTick();
  if (
    !active.value ||
    props.navigationError !== "" ||
    catalog.modifierTask !== task ||
    modifierArchiveOpen.value ||
    modifierOmissionsOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  document.getElementById(heading)?.focus({ preventScroll: true });
}

function beginModifierCreate() {
  const origin = document.activeElement;

  catalog.beginModifierCreate();
  if (catalog.modifierTask?.kind === "modifier-create")
    void focusModifierEntry(
      catalog.modifierTask,
      origin,
      "modifier-form-heading",
    );
}

function beginModifierEdit(id: string) {
  const origin = document.activeElement;

  catalog.beginModifierEdit(id);
  if (
    catalog.modifierTask?.kind === "modifier-edit" &&
    catalog.modifierTask.baseline.id === id
  )
    void focusModifierEntry(
      catalog.modifierTask,
      origin,
      "modifier-form-heading",
    );
}

function beginModifierReorder(id: string) {
  const origin = document.activeElement;

  catalog.beginModifierReorder(id);
  if (
    catalog.modifierTask?.kind === "modifier-reorder" &&
    catalog.modifierTask.baseline.id === id
  )
    void focusModifierEntry(
      catalog.modifierTask,
      origin,
      "modifier-reorder-heading",
    );
}

async function cancelModifierTask() {
  const id = selectedModifierId.value ?? modifierReorderTask.value?.baseline.id;
  const origin = document.activeElement;

  catalog.cancelTask();
  await nextTick();
  if (
    !active.value ||
    props.navigationError !== "" ||
    catalog.task !== null ||
    modifierArchiveOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  (id ? document.getElementById(`modifier-${id}`) : null)?.focus({
    preventScroll: true,
  });
  if (!id || document.getElementById(`modifier-${id}`) === null)
    void focusHeading("modifier-list-heading");
}

async function beginProductEdit(id: string) {
  const origin = document.activeElement;

  catalog.beginProductEdit(id);
  const task = productFormTask.value;

  if (task?.kind !== "product-edit" || task.baseline.id !== id) return;
  await nextTick();
  if (
    !active.value ||
    props.navigationError !== "" ||
    productFormTask.value !== task ||
    productArchiveOpen.value ||
    omissionsOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;

  document
    .getElementById("product-form-heading")
    ?.focus({ preventScroll: true });
}

function beginProductReorder() {
  catalog.beginProductReorder(productCategoryId.value);
  void focusHeading("product-reorder-heading");
}

async function cancelProductTask() {
  const id = selectedProductId.value;

  catalog.cancelTask();
  await nextTick();
  if (!active.value) return;

  const row = id === null ? null : document.getElementById(`product-${id}`);

  if (row !== null) row.focus({ preventScroll: true });
  else void focusHeading("product-list-heading");
}

function beginCreate() {
  catalog.beginCreate();
  void focusHeading("category-form-heading");
}

async function beginEdit(id: string) {
  const origin = document.activeElement;

  catalog.beginEdit(id);
  const task = formTask.value;

  if (task?.kind !== "edit" || task.baseline.id !== id) return;
  await nextTick();
  if (
    !active.value ||
    props.navigationError !== "" ||
    formTask.value !== task ||
    archiveOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;

  const target = window.matchMedia("(max-width: 63.999rem)").matches
    ? "category-form-heading"
    : `category-${id}`;

  document.getElementById(target)?.focus({ preventScroll: true });
}

function beginReorder() {
  catalog.beginReorder();
  void focusHeading("category-reorder-heading");
}

async function beginAssociations(id: string) {
  const origin = document.activeElement;

  catalog.beginAssociations(id);
  const task = associationTask.value;

  if (task === null || task.baseline.category.id !== id) return;
  await nextTick();
  if (
    !associationActive.value ||
    associationTask.value !== task ||
    associationConfirmationOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  document
    .getElementById("association-task-heading")
    ?.focus({ preventScroll: true });
}

async function cancelAssociationTask() {
  const task = associationTask.value;
  const origin = document.activeElement;

  if (task === null || catalog.locked) return;
  const id = task.baseline.category.id;

  catalog.cancelTask();
  await nextTick();
  if (
    !associationActive.value ||
    catalog.task !== null ||
    origin?.closest(".ui-dialog") ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  const target =
    document.getElementById(`category-associations-${id}`) ??
    document.getElementById(`category-${id}`) ??
    document.getElementById("category-list-heading");

  target?.focus({ preventScroll: true });
}

async function confirmAssociationSave() {
  const task = associationTask.value;
  const origin = document.activeElement;

  catalog.confirmAssociationSave();
  const original = catalog.operation;

  if (
    task === null ||
    original?.intent.kind !== "category-associations" ||
    original.status !== "checking"
  )
    return;
  await nextTick();
  if (
    !associationActive.value ||
    associationTask.value !== task ||
    catalog.operation?.intent !== original.intent ||
    associationConfirmationOpen.value ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  document
    .getElementById("association-task-heading")
    ?.focus({ preventScroll: true });
}

async function cancelTask() {
  const id = selectedId.value;

  catalog.cancelTask();
  await nextTick();
  if (!active.value) return;

  (id === null ? null : document.getElementById(`category-${id}`))?.focus({
    preventScroll: true,
  });
  if (id === null || document.getElementById(`category-${id}`) === null)
    void focusHeading("category-list-heading");
}

function leaveTask() {
  archiveOpen.value = false;
  productArchiveOpen.value = false;
  modifierArchiveOpen.value = false;
  catalog.leaveReconciledTask();
  void focusHeading(
    modifierMode.value
      ? "modifier-list-heading"
      : productMode.value
        ? "product-list-heading"
        : "category-list-heading",
  );
}

function synchronize() {
  if (!active.value) return;
  if (props.navigationError !== "") {
    catalog.cancelRead();
    archiveOpen.value = false;
    productArchiveOpen.value = false;
    modifierArchiveOpen.value = false;
    catalog.cancelModifierOmissions();
    catalog.cancelProductOmissions();
    catalog.cancelAssociationConfirmation();

    return;
  }

  if (!session.busy && catalog.allowed && !catalog.locked)
    void catalog.refresh();
}

watch(() => [session.busy, props.navigationError], synchronize);
watch(
  () => catalog.operation?.status,
  async (status) => {
    if (status !== "completed") return;

    const original = catalog.operation;
    const focused = document.activeElement;
    const identity = session.user?.id;
    const ownsFocus = Boolean(
      focused?.closest(
        ".category-form, .category-reorder, .product-form, .product-reorder, .modifier-form, .modifier-reorder, .category-group-assignment, .ui-dialog",
      ),
    );

    archiveOpen.value = false;
    productArchiveOpen.value = false;
    modifierArchiveOpen.value = false;
    await nextTick();
    const groupFocusCurrent =
      (!original?.intent.kind.startsWith("modifier-") &&
        original?.intent.kind !== "category-associations") ||
      (catalog.operation === original &&
        props.navigationError === "" &&
        (document.activeElement === focused ||
          document.activeElement === document.body));

    if (active.value && ownsFocus && groupFocusCurrent) {
      const id = modifierMode.value
        ? catalog.confirmedModifierId
        : productMode.value
          ? catalog.confirmedProductId
          : catalog.confirmedCategoryId;
      const row =
        id === null
          ? null
          : document.getElementById(
              `${original?.intent.kind === "category-associations" ? "category-associations" : modifierMode.value ? "modifier" : productMode.value ? "product" : "category"}-${id}`,
            );

      if (original?.intent.kind === "category-associations") {
        if (
          mode.value === "categories" &&
          catalog.allowed &&
          !session.busy &&
          session.user?.id === identity &&
          catalog.task === null &&
          !archiveOpen.value &&
          !productArchiveOpen.value &&
          !modifierArchiveOpen.value &&
          !omissionsOpen.value &&
          !modifierOmissionsOpen.value &&
          !associationConfirmationOpen.value
        ) {
          const target =
            row instanceof HTMLButtonElement && !row.disabled
              ? row
              : document.getElementById("category-list-heading");

          target?.focus({ preventScroll: true });
        }
      } else if (row !== null) row.focus({ preventScroll: true });
      else
        void focusHeading(
          modifierMode.value
            ? "modifier-list-heading"
            : productMode.value
              ? "product-list-heading"
              : "category-list-heading",
        );
    }

    if (
      (original?.intent.kind === "category-associations" ||
        original?.intent.kind === "archive" ||
        original?.intent.kind === "modifier-archive" ||
        original?.intent.kind === "product-archive") &&
      active.value
    )
      void catalog.refresh();
  },
);
onActivated(() => {
  active.value = true;
  synchronize();
});
onDeactivated(() => {
  catalog.cancelAssociationConfirmation();
  active.value = false;
  archiveOpen.value = false;
  productArchiveOpen.value = false;
  catalog.cancelProductOmissions();
  modifierArchiveOpen.value = false;
  catalog.cancelModifierOmissions();
  catalog.cancelRead();
});
onUnmounted(() => {
  catalog.cancelAssociationConfirmation();
  active.value = false;
  archiveOpen.value = false;
  productArchiveOpen.value = false;
  catalog.cancelProductOmissions();
  modifierArchiveOpen.value = false;
  catalog.cancelModifierOmissions();
  catalog.cancelRead();
});
</script>

<style scoped>
.catalog-page,
.catalog-page__list,
.catalog-page__editor {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.catalog-page__heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
}
.catalog-page__workspace {
  display: grid;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.catalog-page__feedback {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  overflow-wrap: anywhere;
}
.catalog-page__omissions {
  padding-inline-start: var(--space-lg);
  overflow-wrap: anywhere;
}
.catalog-page__description {
  white-space: pre-wrap;
}
.catalog-page__reorder-entry {
  justify-self: start;
}
@media (max-width: 63.999rem) {
  .catalog-page__workspace--associations > .catalog-page__list {
    display: none;
  }
  .catalog-page__workspace--editing:not(.catalog-page__workspace--current)
    > .catalog-page__list {
    display: none;
  }
}
@media (min-width: 64rem) {
  .catalog-page__workspace--editing {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
}
</style>
