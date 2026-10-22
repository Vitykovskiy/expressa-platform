import { computed, readonly, shallowRef } from "vue";
import { MAX_CATALOG_MONEY } from "../../entities/catalog/catalog.constants";
import { useCatalogStore } from "../../entities/catalog/catalog.store";
import type {
  CatalogCommand,
  CatalogItemIdentity,
  CatalogTarget,
} from "../../entities/catalog/catalog.types";
import { CATALOG_SIZES } from "./presentation/CatalogEditor.constants";
import type {
  CatalogCategoryDraft,
  CatalogProductDraft,
} from "./presentation/CatalogEditor.types";
import type {
  CatalogConfirmation,
  CatalogEditor,
} from "./catalog-editor.types";
import { PRESERVE_ASSOCIATIONS } from "./catalog-editor.constants";

export function useCatalogEditor() {
  const catalog = useCatalogStore();
  const editor = shallowRef<CatalogEditor | null>(null);
  const confirmation = shallowRef<CatalogConfirmation | null>(null);
  const error = shallowRef<string | null>(null);
  const notice = shallowRef<string | null>(null);
  let version = 0;

  const busy = computed(() => catalog.command !== null);
  const mode = computed(() =>
    editor.value !== null && "id" in editor.value.target
      ? ("edit" as const)
      : ("create" as const),
  );
  const canSave = computed(() => {
    const current = editor.value;

    if (
      current === null ||
      busy.value ||
      catalog.stale ||
      catalog.loading ||
      current.draft.name.trim() === ""
    ) {
      return false;
    }

    if (current.kind === "category") {
      return true;
    }

    return (
      productOptions.value.some(
        (option) => option.value === current.draft.categoryId,
      ) &&
      (current.draft.hasSizes
        ? current.draft.choices.length >= 2 &&
          current.draft.choices.every((choice) => money(choice.price) !== null)
        : money(current.draft.price) !== null)
    );
  });
  const productOption = computed(
    () =>
      editor.value?.kind === "product" &&
      editor.value.draft.categoryId.startsWith("group:"),
  );
  const categoryOptions = computed(() => {
    const groups = (catalog.data?.modifierGroups ?? []).map((group) => ({
      value: group.id,
      label: group.name,
    }));
    const current = editor.value;

    return current?.kind === "category" && current.originalGroups.length > 1
      ? [
          { value: PRESERVE_ASSOCIATIONS, label: "Сохранить текущие связи" },
          ...groups,
        ]
      : groups;
  });
  const productOptions = computed(() => {
    const current = editor.value;
    const data = catalog.data;

    if (data === null) {
      return [];
    }

    if (current?.target.kind === "option") {
      const optionId = current.target.id;
      const option = data.modifierOptions.find((row) => row.id === optionId);
      const group = data.modifierGroups.find(
        (row) => row.id === option?.groupId,
      );

      return group === undefined
        ? []
        : [{ value: `group:${group.id}`, label: group.name }];
    }

    const categories = data.categories.map((category) => ({
      value: `category:${category.id}`,
      label: category.name,
    }));

    return current?.target.kind === "product"
      ? categories
      : [
          ...categories,
          ...data.modifierGroups.map((group) => ({
            value: `group:${group.id}`,
            label: group.name,
          })),
        ];
  });

  function available() {
    return (
      catalog.data !== null && !busy.value && !catalog.loading && !catalog.stale
    );
  }

  function openCategory(id: string | null, group = false) {
    if (!available()) {
      return;
    }

    const data = catalog.data;

    if (data === null) {
      return;
    }

    const record =
      id === null
        ? null
        : group
          ? data.modifierGroups.find((row) => row.id === id)
          : data.categories.find((row) => row.id === id);

    const links =
      id === null || group
        ? []
        : data.categoryModifierGroups.filter((row) => row.categoryId === id);
    const [firstLink] = links;
    const originalGroupId =
      links.length > 1
        ? PRESERVE_ASSOCIATIONS
        : firstLink === undefined
          ? ""
          : firstLink.groupId;
    const originalGroups = links.map((row) => row.groupId);
    let target: CatalogTarget;

    if (id === null) {
      target = {
        kind: group ? "new-group" : "new-category",
        name: "Новая категория",
      };
    } else {
      if (record === null || record === undefined) {
        return;
      }

      target = { kind: group ? "group" : "category", id, name: record.name };
    }

    editor.value = {
      kind: "category",
      target,
      draft: {
        name: record?.name ?? "",
        isOptionGroup: group,
        optionGroupId: originalGroupId,
      },
      originalGroupId,
      originalGroups,
      summary:
        id === null
          ? null
          : group
            ? `${data.modifierOptions.filter((row) => row.groupId === id).length} опций в группе`
            : `${data.products.filter((row) => row.categoryId === id).length} товаров в категории`,
    };
    version += 1;
    error.value = null;
    notice.value = null;
  }

  function openProduct(target: CatalogItemIdentity | null) {
    if (!available()) {
      return;
    }

    const data = catalog.data;

    if (data === null) {
      return;
    }

    const empty: CatalogProductDraft = {
      categoryId: "",
      name: "",
      hasSizes: false,
      price: "",
      choices: CATALOG_SIZES.map((label) => ({
        key: label,
        id: null,
        label,
        price: "",
      })),
    };

    if (target === null) {
      editor.value = {
        kind: "product",
        target: { kind: "new-product", name: "Новый товар" },
        draft: empty,
        originalChoiceIds: [],
        summary: null,
      };
    } else if (target.kind === "product") {
      const product = data.products.find((row) => row.id === target.id);

      if (product === undefined) {
        return;
      }

      const category = data.categories.find(
        (row) => row.id === product.categoryId,
      );
      const choices = [...product.priceChoices]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((choice) => ({
          key: choice.id,
          id: choice.id,
          label: choice.portionLabel,
          price: String(choice.price),
        }));

      editor.value = {
        kind: "product",
        target: { kind: "product", id: product.id, name: product.name },
        draft: {
          ...empty,
          categoryId: `category:${product.categoryId}`,
          name: product.name,
          hasSizes: product.price === null,
          price: product.price === null ? "" : String(product.price),
          choices: choices.length === 0 ? empty.choices : choices,
        },
        originalChoiceIds: choices.map((row) => row.key),
        summary:
          category === undefined ? null : `Категория: "${category.name}"`,
      };
    } else {
      const option = data.modifierOptions.find((row) => row.id === target.id);

      if (option === undefined) {
        return;
      }

      const group = data.modifierGroups.find(
        (row) => row.id === option.groupId,
      );

      editor.value = {
        kind: "product",
        target: { kind: "option", id: option.id, name: option.name },
        draft: {
          ...empty,
          categoryId: `group:${option.groupId}`,
          name: option.name,
          price: String(option.priceDelta),
        },
        originalChoiceIds: [],
        summary: group === undefined ? null : `Категория: "${group.name}"`,
      };
    }

    version += 1;
    error.value = null;
    notice.value = null;
  }

  function updateCategory(draft: CatalogCategoryDraft) {
    const current = editor.value;

    if (
      current?.kind !== "category" ||
      busy.value ||
      confirmation.value !== null
    ) {
      return;
    }

    const next =
      "id" in current.target
        ? { ...draft, isOptionGroup: current.draft.isOptionGroup }
        : draft;

    editor.value = { ...current, draft: next };
    version += 1;
    error.value = null;
  }

  function updateProduct(draft: CatalogProductDraft) {
    const current = editor.value;

    if (
      current?.kind !== "product" ||
      busy.value ||
      confirmation.value !== null
    ) {
      return;
    }

    editor.value = {
      ...current,
      draft: draft.categoryId.startsWith("group:")
        ? { ...draft, hasSizes: false }
        : draft,
    };
    version += 1;
    error.value = null;
  }

  function close() {
    if (busy.value) {
      return;
    }

    editor.value = null;
    confirmation.value = null;
    error.value = null;
    version += 1;
  }

  function buildSave(): CatalogCommand | null {
    const current = editor.value;

    if (current === null || !canSave.value) {
      return null;
    }

    const name = current.draft.name.trim();
    const id = "id" in current.target ? current.target.id : null;

    if (current.kind === "category") {
      if (current.draft.isOptionGroup) {
        return {
          action: "save-group",
          target:
            id === null
              ? { kind: "new-group", name }
              : { kind: "group", id, name: current.target.name },
          name,
        };
      }

      const changed = current.draft.optionGroupId !== current.originalGroupId;

      return {
        action: "save-category",
        target:
          id === null
            ? { kind: "new-category", name }
            : { kind: "category", id, name: current.target.name },
        name,
        association:
          id !== null && !changed
            ? { kind: "keep" }
            : {
                kind: "replace",
                groupId:
                  current.draft.optionGroupId === ""
                    ? null
                    : current.draft.optionGroupId,
              },
      };
    }

    const [kind, parentId] = current.draft.categoryId.split(":");

    if (parentId === undefined) {
      return null;
    }

    if (kind === "group") {
      const amount = money(current.draft.price);

      if (amount === null) {
        return null;
      }

      return {
        action: "save-option",
        target:
          id === null
            ? { kind: "new-option", groupId: parentId, name }
            : { kind: "option", id, name: current.target.name },
        name,
        amount,
      };
    }

    const target =
      id === null
        ? { kind: "new-product" as const, name }
        : { kind: "product" as const, id, name: current.target.name };

    if (!current.draft.hasSizes) {
      const amount = money(current.draft.price);

      return amount === null
        ? null
        : {
            action: "save-product",
            target,
            values: {
              name,
              categoryId: parentId,
              pricing: { kind: "fixed", amount },
            },
          };
    }

    const choices = [];

    for (const choice of current.draft.choices) {
      const amount = money(choice.price);

      if (amount === null) {
        return null;
      }

      choices.push({ id: choice.id, label: choice.label, amount });
    }

    return {
      action: "save-product",
      target,
      values: {
        name,
        categoryId: parentId,
        pricing: { kind: "choices", choices },
      },
    };
  }

  async function submit() {
    const command = buildSave();
    const current = editor.value;

    if (command === null || current === null) {
      return;
    }

    if (
      current.kind === "category" &&
      current.originalGroups.length > 1 &&
      current.draft.optionGroupId !== current.originalGroupId
    ) {
      const names = current.originalGroups
        .map(
          (id) =>
            catalog.data?.modifierGroups.find((group) => group.id === id)
              ?.name ?? id,
        )
        .join(", ");

      confirmation.value = {
        version,
        command,
        title: "Заменить группы опций?",
        description: `Текущие связи: ${names}. Они будут заменены выбранной группой.`,
        destructive: false,
      };

      return;
    }

    if (
      current.kind === "product" &&
      current.originalChoiceIds.length > 0 &&
      !current.draft.hasSizes
    ) {
      confirmation.value = {
        version,
        command,
        title: "Заменить цены товара?",
        description: `У товара «${current.target.name}» будут удалены существующие ценовые опции: ${current.draft.choices.map((row) => row.label).join(", ")}. Будет сохранена одна цена.`,
        destructive: true,
      };

      return;
    }

    await execute(command);
  }

  function requestDelete() {
    const current = editor.value;

    if (current === null || !("id" in current.target) || busy.value) {
      return;
    }

    const target = current.target;

    confirmation.value = {
      version,
      command: { action: "archive", target },
      title: "Удалить из меню?",
      description: `«${target.name}» будет удалён из меню. Данные ранее оформленных заказов сохранятся.`,
      destructive: true,
    };
  }

  async function confirm() {
    const current = confirmation.value;

    if (current === null || current.version !== version || busy.value) {
      return;
    }

    confirmation.value = null;
    await execute(current.command);
  }

  async function execute(command: CatalogCommand) {
    const expectedVersion = version;
    const result = await catalog.execute(command);

    if (expectedVersion !== version) {
      return;
    }

    if (result.kind === "confirmed") {
      editor.value = null;
      error.value = null;
      notice.value = "Изменения сохранены.";
    } else if (result.kind === "rejected") {
      error.value = result.message;
    }
  }

  function cancelConfirmation() {
    if (!busy.value) {
      confirmation.value = null;
    }
  }

  function acknowledgeUnknown() {
    if (catalog.acknowledgeUnknown()) {
      editor.value = null;
      notice.value =
        "Показано текущее меню. Результат исходной команды не установлен; она не была повторена.";
      version += 1;
    }
  }

  function reset() {
    editor.value = null;
    confirmation.value = null;
    error.value = null;
    notice.value = null;
    version += 1;
  }

  return {
    editor: readonly(editor),
    confirmation: readonly(confirmation),
    error: readonly(error),
    notice: readonly(notice),
    busy,
    mode,
    canSave,
    productOption,
    categoryOptions,
    productOptions,
    openCategory,
    openProduct,
    updateCategory,
    updateProduct,
    close,
    submit,
    requestDelete,
    confirm,
    cancelConfirmation,
    acknowledgeUnknown,
    reset,
  };
}

function money(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed <= MAX_CATALOG_MONEY
    ? parsed
    : null;
}
