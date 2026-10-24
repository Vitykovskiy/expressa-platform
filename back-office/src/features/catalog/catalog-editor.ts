import { computed, readonly, shallowRef } from "vue";
import { useCatalogStore } from "../../entities/catalog/catalog.store";
import type {
  CatalogCommand,
  CatalogItemIdentity,
  CatalogTarget,
} from "../../entities/catalog/catalog.types";
import {
  createChoiceDrafts,
  parseCatalogMoney,
  readPricedChoices,
} from "./catalog-pricing";
import type {
  CatalogCategoryDraft,
  CatalogProductDraft,
} from "./presentation/CatalogEditor.types";
import type {
  CatalogConfirmation,
  CatalogEditor,
} from "./catalog-editor.types";

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
      return (
        current.draft.isOptionGroup ||
        current.draft.optionGroupIds.every((id) =>
          categoryOptions.value.some((group) => group.value === id),
        )
      );
    }

    return (
      productOptions.value.some(
        (option) => option.value === current.draft.categoryId,
      ) &&
      (!productOption.value && current.draft.hasSizes
        ? readPricedChoices(current.draft.choices) !== null
        : parseCatalogMoney(current.draft.price) !== null)
    );
  });
  const categoryOptions = computed(() =>
    (catalog.data?.modifierGroups ?? []).map((group) => ({
      value: group.id,
      label: group.name,
    })),
  );
  const productOptions = computed(() => {
    const data = catalog.data;

    if (data === null) {
      return [];
    }

    const current = editor.value;
    const editing = current !== null && "id" in current.target;
    const categories = data.categories.map((category) => ({
      value: `category:${category.id}`,
      label: category.name,
    }));
    const groups = data.modifierGroups.map((group) => ({
      value: `group:${group.id}`,
      label: `Опции: ${group.name}`,
      selectedLabel: group.name,
    }));

    if (!editing) {
      return [...categories, ...groups];
    }

    return current.target.kind === "option" ? groups : categories;
  });
  const productOption = computed(
    () =>
      editor.value?.kind === "product" &&
      editor.value.draft.categoryId.startsWith("group:"),
  );

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
        optionGroupIds: originalGroups,
        singleSelection:
          group &&
          data.modifierGroups.find((row) => row.id === id)?.selectionType ===
            "single",
      },
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
      choices: createChoiceDrafts([]),
    };

    if (target === null) {
      editor.value = {
        kind: "product",
        target: { kind: "new-product", name: "Новый товар" },
        draft: empty,
        originalChoices: [],
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
      const choices = createChoiceDrafts(product.priceChoices);

      editor.value = {
        kind: "product",
        target: { kind: "product", id: product.id, name: product.name },
        draft: {
          ...empty,
          categoryId: `category:${product.categoryId}`,
          name: product.name,
          hasSizes: product.price === null,
          price: product.price === null ? "" : String(product.price),
          choices,
        },
        originalChoices: product.priceChoices.map((choice) => ({
          id: choice.id,
          label: choice.portionLabel,
        })),
        summary:
          category === undefined ? null : `Категория: "${category.name}"`,
      };
    } else if (target.kind === "option") {
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
        originalChoices: [],
        summary: group === undefined ? null : `Группа: «${group.name}»`,
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
      draft,
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
          values: { singleSelection: current.draft.singleSelection },
          target:
            id === null
              ? { kind: "new-group", name }
              : { kind: "group", id, name: current.target.name },
          name,
        };
      }

      const groups = current.draft.optionGroupIds;
      const changed =
        groups.length !== current.originalGroups.length ||
        groups.some((id, index) => id !== current.originalGroups[index]);

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
            : { kind: "replace", groupIds: groups },
      };
    }

    const [kind, parentId] = current.draft.categoryId.split(":");

    if (parentId === undefined) {
      return null;
    }

    if (kind === "group") {
      const amount = parseCatalogMoney(current.draft.price);

      if (amount === null) {
        return null;
      }

      return {
        action: "save-option",
        target:
          id === null
            ? { kind: "new-option", name }
            : { kind: "option", id, name: current.target.name },
        groupId: parentId,
        name,
        amount,
      };
    }

    if (kind !== "category") {
      return null;
    }

    const target =
      id === null
        ? { kind: "new-product" as const, name }
        : { kind: "product" as const, id, name: current.target.name };

    if (!current.draft.hasSizes) {
      const amount = parseCatalogMoney(current.draft.price);

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

    const choices = readPricedChoices(current.draft.choices);

    if (choices === null) {
      return null;
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

    if (current.kind === "category" && command.action === "save-category") {
      const removed = current.originalGroups.filter(
        (id) => !current.draft.optionGroupIds.includes(id),
      );

      if (removed.length > 0) {
        const names = removed
          .map(
            (id) =>
              catalog.data?.modifierGroups.find((group) => group.id === id)
                ?.name ?? id,
          )
          .join(", ");

        confirmation.value = {
          version,
          command,
          title: "Убрать группы опций?",
          description: `Из категории будут убраны группы: ${names}.`,
          destructive: true,
        };

        return;
      }
    }

    if (current.kind === "product" && command.action === "save-product") {
      const pricing = command.values.pricing;
      const retainedIds = new Set(
        pricing.kind === "choices"
          ? pricing.choices.map((choice) => choice.id)
          : [],
      );
      const removed = current.originalChoices.filter(
        (choice) => !retainedIds.has(choice.id),
      );

      if (removed.length > 0) {
        const consequence =
          pricing.kind === "fixed"
            ? "Будет сохранена одна цена."
            : "Остальные ценовые опции сохранятся.";

        confirmation.value = {
          version,
          command,
          title: "Сохранить изменения товара?",
          description: `Будут удалены ценовые опции: ${removed.map((choice) => choice.label).join(", ")}. ${consequence}`,
          destructive: true,
        };

        return;
      }
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
    categoryOptions,
    productOptions,
    productOption,
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
