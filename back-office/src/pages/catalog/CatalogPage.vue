<template>
  <main ref="root" class="catalog-page" tabindex="-1">
    <p v-if="editor.notice.value" class="catalog-page__message" role="status">
      {{ editor.notice.value }}
    </p>
    <CatalogMenu
      :categories="lists.categories"
      :option-groups="lists.optionGroups"
      :summary="summary"
      :loading="initialLoading"
      :error="catalog.error"
      :disabled="commandsDisabled"
      @create-category="editor.openCategory(null)"
      @create-product="editor.openProduct(null)"
      @edit-category="editor.openCategory($event)"
      @edit-option-group="editor.openCategory($event, true)"
      @edit-product="editor.openProduct($event)"
      @retry="catalog.load"
    />
    <CatalogCategoryDialog
      v-if="categoryEditor"
      :open="ordinaryDialogOpen"
      :mode="editor.mode.value"
      :summary="categoryEditor.summary"
      :pending="editor.busy.value"
      :can-save="editor.canSave.value"
      :error="editor.error.value"
      :draft="categoryEditor.draft"
      :options="editor.categoryOptions.value"
      @update:draft="editor.updateCategory"
      @save="editor.submit"
      @delete="editor.requestDelete"
      @close="editor.close"
    />
    <CatalogProductDialog
      v-if="productEditor"
      :open="ordinaryDialogOpen"
      :mode="editor.mode.value"
      :summary="productEditor.summary"
      :pending="editor.busy.value"
      :can-save="editor.canSave.value"
      :error="editor.error.value"
      :draft="productEditor.draft"
      :categories="editor.productOptions.value"
      :is-option="editor.productOption.value"
      @update:draft="editor.updateProduct"
      @save="editor.submit"
      @delete="editor.requestDelete"
      @close="editor.close"
    />
    <OperationsModal
      v-if="editor.confirmation.value"
      :open="true"
      :title="editor.confirmation.value.title"
      :description="editor.confirmation.value.description"
      layout="confirmation"
      bottom-sheet
      @close="editor.cancelConfirmation"
    >
      <template #actions>
        <OperationsButton
          label="Отмена"
          kind="ghost"
          compact
          @click="editor.cancelConfirmation"
        />
        <OperationsButton
          label="Подтвердить"
          :kind="confirmationKind"
          compact
          @click="editor.confirm"
        />
      </template>
    </OperationsModal>
    <OperationsModal
      :open="hasUnknownCommand"
      title="Результат изменения неизвестен"
      :description="unknownDescription"
      layout="confirmation"
      persistent
      bottom-sheet
    >
      <p class="catalog-page__recovery">{{ recoveryDescription }}</p>
      <p v-if="currentTargetDescription" class="catalog-page__recovery">
        {{ currentTargetDescription }}
      </p>
      <template #actions>
        <OperationsButton
          label="Проверить состояние"
          kind="secondary"
          compact
          :disabled="catalog.loading"
          @click="catalog.load"
        />
        <OperationsButton
          label="Вернуться в меню"
          compact
          :disabled="cannotAcknowledge"
          @click="editor.acknowledgeUnknown"
        />
      </template>
    </OperationsModal>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onScopeDispose,
  useTemplateRef,
  watch,
} from "vue";
import { useCatalogStore } from "../../entities/catalog/catalog.store";
import {
  countLabel,
  mapCatalogLists,
} from "../../entities/catalog/catalog.mapper";
import { useCatalogEditor } from "../../features/catalog/model/catalog-editor";
import CatalogCategoryDialog from "../../features/catalog/ui/CatalogCategoryDialog.vue";
import CatalogProductDialog from "../../features/catalog/ui/CatalogProductDialog.vue";
import CatalogMenu from "../../widgets/catalog/CatalogMenu.vue";
import OperationsModal from "../../shared/ui/operations/OperationsModal.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import type { CatalogPageEmits, CatalogPageProps } from "./CatalogPage.types";

const props = defineProps<CatalogPageProps>();
const emit = defineEmits<CatalogPageEmits>();
const catalog = useCatalogStore();
const editor = useCatalogEditor();
const root = useTemplateRef<globalThis.HTMLElement>("root");
let disposed = false;

const lists = computed(() => {
  if (catalog.data === null) {
    // Пустая проекция до ответа не означает пустое меню: загрузка и ошибка передаются отдельно.
    return { categories: [], optionGroups: [] };
  }

  return mapCatalogLists(catalog.data);
});

const initialLoading = computed(
  () => catalog.loading || (catalog.data === null && catalog.error === null),
);

const commandsDisabled = computed(
  () =>
    catalog.stale ||
    catalog.loading ||
    editor.busy.value ||
    catalog.data === null,
);

const summary = computed(() => {
  const categories = countLabel(lists.value.categories.length, [
    "категория",
    "категории",
    "категорий",
  ]);
  const optionGroups = countLabel(lists.value.optionGroups.length, [
    "группа опций",
    "группы опций",
    "групп опций",
  ]);

  return `${categories} · ${optionGroups}`;
});

const categoryEditor = computed(() =>
  editor.editor.value?.kind === "category" ? editor.editor.value : null,
);

const productEditor = computed(() =>
  editor.editor.value?.kind === "product" ? editor.editor.value : null,
);

const hasUnknownCommand = computed(() => catalog.command?.phase === "unknown");

const ordinaryDialogOpen = computed(
  () => !hasUnknownCommand.value && editor.confirmation.value === null,
);

const cannotAcknowledge = computed(
  () => catalog.command?.checked !== true || catalog.loading,
);

const confirmationKind = computed(() =>
  editor.confirmation.value?.destructive
    ? ("destructive" as const)
    : ("primary" as const),
);

const unknownDescription = computed(() =>
  catalog.command === null
    ? ""
    : `Объект: «${catalog.command.command.target.name}». Команда отправлена; подтверждения нет. Повтор автоматически не выполняется.`,
);

const currentTargetDescription = computed(() => {
  const target = catalog.command?.command.target;
  const data = catalog.data;

  if (
    target === undefined ||
    data === null ||
    catalog.command?.checked !== true
  ) {
    return null;
  }

  if (!("id" in target)) {
    return "Перед повторным созданием проверьте список: новый объект мог сохраниться.";
  }

  let currentName: string | undefined;

  switch (target.kind) {
    case "category":
      currentName = data.categories.find((row) => row.id === target.id)?.name;
      break;
    case "group":
      currentName = data.modifierGroups.find(
        (row) => row.id === target.id,
      )?.name;
      break;
    case "product":
      currentName = data.products.find((row) => row.id === target.id)?.name;
      break;
    case "option":
      currentName = data.modifierOptions.find(
        (row) => row.id === target.id,
      )?.name;
      break;
    default: {
      const unsupportedTarget: never = target;

      return unsupportedTarget;
    }
  }

  return currentName === undefined
    ? `Исходный объект «${target.name}» отсутствует в текущем меню.`
    : `Исходный объект сейчас в меню: «${currentName}».`;
});

const recoveryDescription = computed(() =>
  catalog.command?.checked
    ? "Текущее состояние меню получено. Оно не подтверждает результат исходной команды. Вернитесь в меню и проверьте объект перед новыми действиями."
    : (catalog.error ??
      "Проверьте текущее состояние меню. Исходное изменение остаётся заблокировано до проверки."),
);

watch(
  () => catalog.sessionExpired,
  (expired) => {
    if (expired) {
      editor.reset();
      emit("sessionExpired");
    }
  },
);

watch(
  () => props.context,
  (context) => {
    editor.reset();
    void catalog.activate(context);
  },
);

onMounted(async () => {
  globalThis.document.title = "Меню · Expressa";
  await nextTick();

  if (disposed) {
    return;
  }

  root.value?.focus();
  await catalog.activate(props.context);
});

onScopeDispose(() => {
  // KeepAlive сохраняет черновик; обычные чтения при смене раздела останавливает StaffScreen.
  disposed = true;
  catalog.deactivate();
});
</script>

<style scoped>
.catalog-page {
  flex: 1;
  min-width: 0;
  height: 100dvh;
  overflow: auto;
  outline: none;
  background: var(--color-surface);
}
.catalog-page__message {
  margin: 0;
  padding: 12px 24px 0;
  color: var(--color-foreground-muted);
  font:
    400 13px/19.5px Inter,
    sans-serif;
}
.catalog-page__recovery {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
@media (max-width: 767px) {
  .catalog-page {
    height: calc(100dvh - 60px);
    background: var(--color-background);
  }
}
</style>
