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
import { createGroupDraft, readGroupValues } from "./catalog-group-draft";
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
      return (
        !current.draft.isOptionGroup ||
        readGroupValues(current.draft.group) !== null
      );
    }

    return (
      productOptions.value.some(
        (option) => option.value === current.draft.categoryId,
      ) &&
      (current.draft.hasSizes
        ? readPricedChoices(current.draft.choices) !== null
        : parseCatalogMoney(current.draft.price) !== null)
    );
  });
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
    const data = catalog.data;

    if (data === null) {
      return [];
    }

    const categories = data.categories.map((category) => ({
      value: `category:${category.id}`,
      label: category.name,
    }));

    return categories;
  });

  const inheritedGroups = computed(() => {
    const current = editor.value;
    const data = catalog.data;

    if (current?.kind !== "product" || data === null) {
      return [];
    }

    const categoryId = current.draft.categoryId.replace(/^category:/, "");

    return data.categoryModifierGroups
      .filter((link) => link.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((link) => ({
        value: link.groupId,
        label:
          data.modifierGroups.find((group) => group.id === link.groupId)
            ?.name ?? link.groupId,
      }));
  });
  const ownGroups = computed(() => {
    const current = editor.value;

    if (current?.kind !== "product") {
      return [];
    }

    return (catalog.data?.modifierGroups ?? [])
      .filter(
        (group) =>
          !inheritedGroups.value.some(
            (inherited) => inherited.value === group.id,
          ) || current.draft.modifierGroupIds.includes(group.id),
      )
      .map((group) => ({ value: group.id, label: group.name }));
  });

  function available() {
    return (
      catalog.data !== null && !busy.value && !catalog.loading && !catalog.stale
    );
  }

  function openCategory(
    id: string | null,
    group = false,
    focusOptionKey: string | null = null,
  ) {
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
        group: createGroupDraft(
          group
            ? (data.modifierGroups.find((row) => row.id === id) ?? null)
            : null,
          group ? data.modifierOptions.filter((row) => row.groupId === id) : [],
        ),
      },
      originalGroupId,
      originalGroups,
      originalOptions: group
        ? data.modifierOptions
            .filter((row) => row.groupId === id)
            .map(({ id, name }) => ({ id, name }))
        : [],
      focusOptionKey,
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

    if (target?.kind === "option") {
      const option = data.modifierOptions.find((row) => row.id === target.id);

      if (option !== undefined) {
        openCategory(option.groupId, true, option.id);
      }

      return;
    }

    const empty: CatalogProductDraft = {
      modifierGroupIds: [],
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
        originalModifierGroups: [],
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
          modifierGroupIds: data.productModifierGroups
            .filter((row) => row.productId === product.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((row) => row.groupId),
        },
        originalModifierGroups: data.productModifierGroups
          .filter((row) => row.productId === product.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((row) => row.groupId),
        originalChoices: product.priceChoices.map((choice) => ({
          id: choice.id,
          label: choice.portionLabel,
        })),
        summary:
          category === undefined ? null : `Категория: "${category.name}"`,
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
        const values = readGroupValues(current.draft.group);

        if (values === null) {
          return null;
        }

        return {
          values,
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

    if (kind !== "category" || parentId === undefined) {
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
              ...productGroupValues(current),
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
        ...productGroupValues(current),
        categoryId: parentId,
        pricing: { kind: "choices", choices },
      },
    };
  }

  function productGroupValues(
    current: Extract<CatalogEditor, { kind: "product" }>,
  ) {
    const groups = current.draft.modifierGroupIds;
    const original = current.originalModifierGroups;

    return groups.length === original.length &&
      groups.every((id, index) => id === original[index])
      ? {}
      : { modifierGroupIds: groups };
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

    if (current.kind === "category" && command.action === "save-group") {
      const ids = new Set(command.values.options.map((option) => option.id));
      const removed = current.originalOptions.filter(
        (option) => !ids.has(option.id),
      );

      if (removed.length > 0) {
        confirmation.value = {
          version,
          command,
          title: "Удалить опции группы?",
          description: `Из группы «${current.target.name}» будут удалены опции: ${removed.map((option) => option.name).join(", ")}.`,
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

      const removedGroups = current.originalModifierGroups.filter(
        (id) => !current.draft.modifierGroupIds.includes(id),
      );

      if (removed.length > 0 || removedGroups.length > 0) {
        const consequence =
          pricing.kind === "fixed"
            ? "Будет сохранена одна цена."
            : "Остальные ценовые опции сохранятся.";

        confirmation.value = {
          version,
          command,
          title: "Сохранить изменения товара?",
          description: [
            removed.length === 0
              ? null
              : `Будут удалены ценовые опции: ${removed.map((choice) => choice.label).join(", ")}. ${consequence}`,
            removedGroups.length === 0
              ? null
              : `Будут удалены собственные группы: ${removedGroups.map((id) => catalog.data?.modifierGroups.find((group) => group.id === id)?.name ?? id).join(", ")}.`,
          ]
            .filter((text) => text !== null)
            .join(" "),
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
    inheritedGroups,
    ownGroups,
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
