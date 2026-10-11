import { computed, readonly, ref } from "vue";
import type { DeepReadonly } from "vue";
import { defineStore } from "pinia";
import { ApiFailure, isRecord } from "../../shared/api/transport";
import { useSessionStore } from "../session/session.store";
import { readCatalog, writeCategory } from "./catalog.api";
import { writeCategoryAssociations } from "./category-association.api";
import {
  copyAssociationBaseline,
  sameAssociationBaseline,
  visibleCategoryLinks,
} from "./category-association.mapper";
import { writeProduct } from "./product.api";
import { writeModifier } from "./modifier.api";
import {
  copyModifier,
  copyModifierDraft,
  emptyModifierOption,
  modifierAggregate,
  modifierDraft,
  modifierFields,
  sameModifier,
  validModifierOrders,
} from "./modifier.mapper";
import {
  modifierFieldErrors,
  modifierOptionFieldErrors,
} from "./modifier.constants";
import {
  copyProduct,
  copyProductDraft,
  emptyChoice,
  productDraft,
  productFields,
  sameProduct,
  validChoiceOrders,
} from "./product.mapper";
import {
  catalogInt32Maximum,
  categoryFieldErrors,
  productChoiceFieldErrors,
  productFieldErrors,
} from "./catalog.constants";
import { categoryDraft, sameCategoryFields } from "./catalog.mapper";
import type {
  AssociationConfirmation,
  AssociationErrors,
  AssociationIntent,
  AssociationTask,
  Catalog,
  CatalogCommandResponse,
  CatalogTask,
  CatalogIntent,
  CatalogOperation,
  ProductIntent,
  ProductDraft,
  ProductErrors,
  ProductField,
  ProductChoiceField,
  ProductOmissionConfirmation,
  CategoryDraft,
  CategoryErrors,
  CategoryField,
  ModifierDraft,
  ModifierIntent,
  ModifierErrors,
  ModifierField,
  ModifierOptionField,
  ModifierOmissionConfirmation,
  ModifierValidationState,
  ModifierValidationTarget,
  ModifierTask,
  ModifierErrorFocus,
} from "./catalog.types";

export const useCatalogStore = defineStore("catalog", () => {
  const session = useSessionStore();
  const data = ref<Catalog | null>(null);
  const task = ref<CatalogTask | null>(null);
  const operation = ref<CatalogOperation | null>(null);
  const errors = ref<CategoryErrors>({});
  const associationConfirmation = ref<AssociationConfirmation | null>(null);
  const associationErrors = ref<AssociationErrors>({
    membership: "",
    category: "",
    form: "",
  });
  const associationTask = computed(() =>
    task.value?.kind === "category-associations" ? task.value : null,
  );
  const productErrors = ref<ProductErrors>({
    fields: {},
    choices: {},
    form: "",
  });
  const omissionConfirmation = ref<ProductOmissionConfirmation | null>(null);
  const confirmedProductId = ref<string | null>(null);
  const modifierErrors = ref<ModifierErrors>({
    fields: {},
    options: {},
    optionsMessage: "",
    form: "",
  });
  const modifierOmissionConfirmation = ref<ModifierOmissionConfirmation | null>(
    null,
  );
  const confirmedModifierId = ref<string | null>(null);
  const modifierErrorFocus = ref<ModifierErrorFocus | null>(null);
  let modifierFocusSequence = 0;
  let modifierValidation = emptyModifierValidation();
  const modifierTask = computed(() => {
    const current = task.value;

    return current?.kind === "modifier-create" ||
      current?.kind === "modifier-edit" ||
      current?.kind === "modifier-reorder"
      ? current
      : null;
  });
  const categoryTask = computed(() => {
    const current = task.value;

    return current?.kind === "create" ||
      current?.kind === "edit" ||
      current?.kind === "reorder"
      ? current
      : null;
  });
  const productTask = computed(() => {
    const current = task.value;

    return current?.kind === "product-create" ||
      current?.kind === "product-edit" ||
      current?.kind === "product-reorder"
      ? current
      : null;
  });
  const fresh = ref(false);
  const pending = ref(false);
  const error = ref("");
  const mutationEpoch = ref(0);
  const confirmedCategoryId = ref<string | null>(null);
  const allowed = computed(
    () => session.status === "staff" && session.user?.role === "administrator",
  );
  const locked = computed(
    () =>
      operation.value !== null &&
      !["completed", "rejected", "abandoned"].includes(operation.value.status),
  );
  const busy = computed(
    () =>
      operation.value?.status === "checking" ||
      operation.value?.status === "sending" ||
      operation.value?.status === "reconciling",
  );
  const dirty = computed(() => {
    const current = task.value;

    if (current === null) return false;
    if (current.kind === "category-associations")
      return (
        current.ids.some(
          (id, index) => id !== current.baseline.links[index]?.groupId,
        ) || current.ids.length !== current.baseline.links.length
      );
    if (current.kind === "modifier-reorder")
      return current.ids.some(
        (id, index) => id !== current.baseline.options[index]?.id,
      );
    if (current.kind === "modifier-create" || current.kind === "modifier-edit")
      return (
        JSON.stringify(current.draft) !== JSON.stringify(current.initialDraft)
      );
    if (current.kind === "product-reorder")
      return current.ids.some(
        (id, index) => id !== current.baseline[index]?.id,
      );
    if (current.kind === "product-create" || current.kind === "product-edit")
      return (
        JSON.stringify(current.draft) !== JSON.stringify(current.initialDraft)
      );
    if (current.kind === "create")
      return (
        current.draft.name !== "" ||
        current.draft.description !== "" ||
        current.draft.sortOrder !== "" ||
        current.draft.isActive
      );
    if (current.kind === "reorder")
      return current.ids.some(
        (id, index) => id !== current.baseline[index]?.id,
      );

    const baseline = categoryDraft(current.baseline);

    return Object.keys(baseline).some((key) => {
      const field = key as CategoryField;

      return baseline[field] !== current.draft[field];
    });
  });
  let accessEpoch = 0;
  let readEpoch = 0;
  let operationEpoch = 0;
  let ordinary: AbortController | null = null;
  let recovery: AbortController | null = null;
  let preflight: AbortController | null = null;

  function currentAccess(epoch: number, identity: string | undefined) {
    return (
      epoch === accessEpoch && allowed.value && identity === session.user?.id
    );
  }

  function guardAccess(epoch: number, identity: string | undefined) {
    if (!currentAccess(epoch, identity)) throw new ApiFailure("aborted");
  }

  function cancelRead() {
    readEpoch += 1;
    ordinary?.abort();
    ordinary = null;
    pending.value = false;
  }

  function clear() {
    accessEpoch += 1;
    operationEpoch += 1;
    cancelRead();
    recovery?.abort();
    preflight?.abort();
    recovery = null;
    preflight = null;
    data.value = null;
    task.value = null;
    resetAssociationFeedback();
    operation.value = null;
    confirmedCategoryId.value = null;
    confirmedProductId.value = null;
    confirmedModifierId.value = null;
    modifierOmissionConfirmation.value = null;
    resetModifierValidation();
    modifierErrors.value = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
    omissionConfirmation.value = null;
    productErrors.value = { fields: {}, choices: {}, form: "" };
    errors.value = {};
    fresh.value = false;
    error.value = "";
  }

  async function refresh() {
    if (!allowed.value || session.busy || ordinary !== null || locked.value)
      return;

    const controller = new AbortController();
    const access = accessEpoch;
    const identity = session.user?.id;
    const version = ++readEpoch;

    ordinary = controller;
    pending.value = true;

    try {
      const current = await session.authenticatedGet((token) => {
        guardAccess(access, identity);

        return readCatalog(token, controller.signal);
      });

      if (
        !currentAccess(access, identity) ||
        version !== readEpoch ||
        controller.signal.aborted
      )
        return;

      data.value = current;
      fresh.value = true;
      error.value = "";
      associationConfirmation.value = null;
      const association = associationTask.value;

      if (
        association !== null &&
        !sameAssociationBaseline(associationIntent(association), current)
      ) {
        operation.value = {
          intent: associationIntent(association),
          status: "conflict",
          message: "Категория или связанные группы изменились",
        };

        return;
      }

      if (operation.value?.status === "rejected") operation.value = null;
    } catch {
      if (
        currentAccess(access, identity) &&
        version === readEpoch &&
        !controller.signal.aborted
      ) {
        fresh.value = false;
        error.value =
          data.value === null
            ? "Не удалось загрузить каталог"
            : "Не удалось обновить каталог";
        if (operation.value?.status === "rejected")
          operation.value.message = error.value;
      }
    } finally {
      if (ordinary === controller) {
        ordinary = null;
        pending.value = false;
      }
    }
  }

  function canStart() {
    return (
      allowed.value &&
      !session.busy &&
      fresh.value &&
      !locked.value &&
      !dirty.value &&
      task.value === null
    );
  }

  function beginCreate() {
    if (!canStart()) return;

    task.value = {
      kind: "create",
      draft: { name: "", description: "", sortOrder: "", isActive: false },
    };
    operation.value = null;
    errors.value = {};
  }

  function beginEdit(id: string) {
    if (!canStart()) return;

    const category = data.value?.categories.find((item) => item.id === id);

    if (category === undefined) return;

    task.value = {
      kind: "edit",
      baseline: { ...category },
      draft: categoryDraft(category),
    };
    operation.value = null;
    errors.value = {};
  }

  function beginReorder() {
    if (!canStart() || data.value === null || data.value.categories.length < 2)
      return;

    task.value = {
      kind: "reorder",
      baseline: data.value.categories.map((item) => ({ ...item })),
      ids: data.value.categories.map((item) => item.id),
    };
    confirmedCategoryId.value = null;
    operation.value = null;
    errors.value = {};
  }

  function editDraft(draft: CategoryDraft) {
    if (
      locked.value ||
      !allowed.value ||
      categoryTask.value === null ||
      categoryTask.value.kind === "reorder"
    )
      return;

    const current = categoryTask.value;

    if (current === null) return;

    const previous = current.draft;

    current.draft = { ...draft };
    for (const field of Object.keys(errors.value) as CategoryField[]) {
      if (previous[field] !== draft[field]) delete errors.value[field];
    }
  }

  function move(id: string, direction: -1 | 1) {
    const current = task.value;

    if (locked.value || !allowed.value || current?.kind !== "reorder") return;

    const index = current.ids.indexOf(id);
    const destination = index + direction;
    const neighbor = current.ids[destination];

    if (index < 0 || neighbor === undefined) return;

    current.ids.splice(index, 1);
    current.ids.splice(destination, 0, id);
  }

  function beginProductCreate(categoryId: string) {
    if (
      !canStart() ||
      (categoryId !== "" &&
        !data.value?.categories.some((item) => item.id === categoryId))
    )
      return;

    const draft = productDraft(undefined, categoryId);

    task.value = {
      kind: "product-create",
      draft,
      initialDraft: copyProductDraft(draft),
      revision: 0,
      nextKey: 0,
    };
    operation.value = null;
    productErrors.value = { fields: {}, choices: {}, form: "" };
  }

  function beginProductEdit(id: string) {
    if (!canStart()) return;

    const product = data.value?.products.find((item) => item.id === id);

    const category = data.value?.categories.find(
      (item) => item.id === product?.categoryId,
    );

    if (product === undefined || category === undefined) return;

    const draft = productDraft(product);

    task.value = {
      kind: "product-edit",
      baseline: copyProduct(product),
      category: { ...category },
      draft,
      initialDraft: copyProductDraft(draft),
      revision: 0,
      nextKey: draft.choices.length,
    };
    operation.value = null;
    productErrors.value = { fields: {}, choices: {}, form: "" };
  }

  function beginProductReorder(categoryId: string) {
    if (!canStart()) return;

    const category = data.value?.categories.find(
      (item) => item.id === categoryId,
    );
    const products = data.value?.products
      .filter((item) => item.categoryId === categoryId)
      .map(copyProduct);

    if (category === undefined || products === undefined || products.length < 2)
      return;

    task.value = {
      kind: "product-reorder",
      category: { ...category },
      baseline: products,
      ids: products.map((item) => item.id),
    };
    operation.value = null;
    confirmedProductId.value = null;
  }

  function editProductDraft(draft: ProductDraft) {
    const current = productTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "product-reorder"
    )
      return;

    current.draft = copyProductDraft(draft);
    current.revision += 1;
    omissionConfirmation.value = null;
    productErrors.value = { fields: {}, choices: {}, form: "" };
  }

  function setProductMode(mode: ProductDraft["mode"]) {
    const current = productTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "product-reorder"
    )
      return;

    const draft = copyProductDraft(current.draft);

    draft.mode = mode;
    if (
      mode === "choices" &&
      draft.choices.length === 0 &&
      draft.removed.length === 0
    ) {
      draft.choices = [
        emptyChoice(current.nextKey),
        emptyChoice(current.nextKey + 1),
      ];
      current.nextKey += 2;
    }

    editProductDraft(draft);
  }

  function addChoice() {
    const current = productTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "product-reorder"
    )
      return;

    const draft = copyProductDraft(current.draft);

    draft.choices.push(emptyChoice(current.nextKey++));
    editProductDraft(draft);
  }

  function removeChoice(key: number) {
    const current = productTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "product-reorder"
    )
      return;

    const draft = copyProductDraft(current.draft);
    const choice = draft.choices.find((item) => item.key === key);

    if (choice === undefined) return;

    draft.choices = draft.choices.filter((item) => item.key !== key);
    if (choice.id !== null) draft.removed.push(choice);
    editProductDraft(draft);
  }

  function restoreChoice(key: number) {
    const current = productTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "product-reorder"
    )
      return;

    const draft = copyProductDraft(current.draft);
    const choice = draft.removed.find((item) => item.key === key);

    if (choice === undefined) return;

    draft.removed = draft.removed.filter((item) => item.key !== key);
    draft.choices.push(choice);
    editProductDraft(draft);
  }

  function moveChoice(key: number, direction: -1 | 1) {
    const current = productTask.value;

    if (
      current === null ||
      current.kind === "product-reorder" ||
      !validChoiceOrders(current.draft.choices)
    )
      return;

    const draft = copyProductDraft(current.draft);
    const index = draft.choices.findIndex((item) => item.key === key);
    const choice = draft.choices[index];
    const neighbor = draft.choices[index + direction];

    if (choice === undefined || neighbor === undefined) return;

    const order = choice.sortOrder;

    choice.sortOrder = neighbor.sortOrder;
    neighbor.sortOrder = order;
    draft.choices.splice(index, 1);
    draft.choices.splice(index + direction, 0, choice);
    editProductDraft(draft);
  }

  function moveProduct(id: string, direction: -1 | 1) {
    const current = productTask.value;

    if (!allowed.value || locked.value || current?.kind !== "product-reorder")
      return;

    const index = current.ids.indexOf(id);

    if (index < 0 || current.ids[index + direction] === undefined) return;

    current.ids.splice(index, 1);
    current.ids.splice(index + direction, 0, id);
  }

  function cancelProductOmissions() {
    omissionConfirmation.value = null;
  }

  function beginModifierCreate() {
    if (!canStart()) return;
    const draft = modifierDraft();

    task.value = {
      kind: "modifier-create",
      draft,
      initialDraft: copyModifierDraft(draft),
      revision: 0,
      nextKey: 0,
    };
    operation.value = null;
    resetModifierValidation();
    modifierErrors.value = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
  }

  function beginModifierEdit(id: string) {
    if (!canStart() || data.value === null) return;
    const baseline = modifierAggregate(data.value, id);

    if (baseline === null) return;
    const draft = modifierDraft(baseline);

    task.value = {
      kind: "modifier-edit",
      baseline,
      draft,
      initialDraft: copyModifierDraft(draft),
      revision: 0,
      nextKey: draft.options.length,
    };
    operation.value = null;
    resetModifierValidation();
    modifierErrors.value = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
  }

  function beginModifierReorder(id: string) {
    if (!canStart() || data.value === null) return;
    const baseline = modifierAggregate(data.value, id);

    if (baseline === null || baseline.options.length < 2) return;
    task.value = {
      kind: "modifier-reorder",
      baseline,
      ids: baseline.options.map((item) => item.id),
    };
    confirmedModifierId.value = null;
    operation.value = null;
    resetModifierValidation();
  }

  function emptyModifierValidation(): ModifierValidationState {
    return {
      fields: [],
      options: {},
      submitted: false,
      rejected: { fields: {}, options: {}, optionsMessage: "", form: "" },
    };
  }

  function resetModifierValidation() {
    modifierValidation = emptyModifierValidation();
    modifierErrorFocus.value = null;
  }

  function updateModifierFeedback() {
    const current = modifierTask.value;

    if (current === null || current.kind === "modifier-reorder") return;
    const validated = modifierFields(
      current.draft,
      current.kind === "modifier-edit" ? current.baseline : undefined,
    ).errors;
    const rejected = modifierValidation.rejected;
    const feedback: ModifierErrors = {
      fields: { ...rejected.fields },
      options: {},
      optionsMessage: "",
      form: rejected.form || validated.form,
    };

    for (const field of Object.keys(validated.fields) as ModifierField[]) {
      if (
        modifierValidation.submitted ||
        modifierValidation.fields.includes(field)
      )
        feedback.fields[field] ??= validated.fields[field];
    }

    for (const option of current.draft.options) {
      const invalid = validated.options[option.key] ?? {};
      const touched = modifierValidation.options[option.key] ?? [];
      const row = { ...rejected.options[option.key] };

      for (const field of Object.keys(invalid) as (
        ModifierOptionField | "row"
      )[]) {
        if (
          modifierValidation.submitted ||
          (field === "row" ? touched.length > 0 : touched.includes(field))
        )
          row[field] ??= invalid[field];
      }

      if (Object.keys(row).length > 0) feedback.options[option.key] = row;
    }

    const aggregateTouched =
      modifierValidation.fields.some((field) => field !== "name") ||
      Object.values(modifierValidation.options).some((fields) =>
        fields.some((field) => field !== "name"),
      );

    feedback.optionsMessage =
      rejected.optionsMessage ||
      (modifierValidation.submitted || aggregateTouched
        ? validated.optionsMessage
        : "");
    modifierErrors.value = feedback;
  }

  function validateModifier(
    target: ModifierValidationTarget,
    context: DeepReadonly<ModifierTask>,
    revision: number,
  ) {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      session.busy ||
      locked.value ||
      modifierOmissionConfirmation.value !== null ||
      current === null ||
      current.kind === "modifier-reorder" ||
      readonly(current) !== context ||
      current.revision !== revision
    )
      return;
    if (target.kind === "field") {
      if (!modifierValidation.fields.includes(target.field))
        modifierValidation.fields.push(target.field);
      if (
        (target.field === "minSelect" || target.field === "selectionType") &&
        current.draft.maxSelect.trim() !== "" &&
        !modifierValidation.fields.includes("maxSelect")
      )
        modifierValidation.fields.push("maxSelect");
    } else {
      if (!current.draft.options.some((option) => option.key === target.key))
        return;
      const fields = modifierValidation.options[target.key] ?? [];

      if (!fields.includes(target.field)) fields.push(target.field);
      modifierValidation.options[target.key] = fields;
    }

    updateModifierFeedback();
  }

  function clearChangedModifierRejections(
    previous: ModifierDraft,
    draft: ModifierDraft,
  ) {
    const rejected = modifierValidation.rejected;

    for (const field of Object.keys(modifierFieldErrors) as ModifierField[]) {
      if (previous[field] !== draft[field]) delete rejected.fields[field];
    }

    for (const option of draft.options) {
      const original = previous.options.find((item) => item.key === option.key);
      const errors = rejected.options[option.key];

      if (original === undefined || errors === undefined) continue;
      for (const field of Object.keys(errors) as (
        ModifierOptionField | "row"
      )[]) {
        if (field !== "row" && original[field] !== option[field])
          delete errors[field];
      }
    }

    if (
      JSON.stringify(previous.options) !== JSON.stringify(draft.options) ||
      previous.minSelect !== draft.minSelect ||
      previous.maxSelect !== draft.maxSelect ||
      previous.selectionType !== draft.selectionType ||
      previous.isActive !== draft.isActive
    )
      rejected.optionsMessage = "";
  }

  function editModifierDraft(draft: ModifierDraft) {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "modifier-reorder"
    )
      return;
    const rows = [...draft.options, ...draft.removed];

    if (
      new Set(rows.map((item) => item.key)).size !== rows.length ||
      rows.some((item) => {
        const original = current.initialDraft.options.find(
          (entry) => entry.key === item.key,
        );

        return (
          !Number.isSafeInteger(item.key) ||
          item.key < 0 ||
          item.key >= current.nextKey ||
          item.id !== (original?.id ?? null)
        );
      }) ||
      current.initialDraft.options.some(
        (item) => !rows.some((entry) => entry.key === item.key),
      ) ||
      draft.removed.some((item) => item.id === null)
    )
      return;

    clearChangedModifierRejections(current.draft, draft);
    current.draft = copyModifierDraft(draft);
    current.revision += 1;
    modifierOmissionConfirmation.value = null;
    updateModifierFeedback();
  }

  function addModifierOption() {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "modifier-reorder"
    )
      return;
    const draft = copyModifierDraft(current.draft);

    draft.options.push(emptyModifierOption(current.nextKey++));
    editModifierDraft(draft);
  }

  function removeModifierOption(key: number) {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "modifier-reorder"
    )
      return;
    const draft = copyModifierDraft(current.draft);
    const option = draft.options.find((item) => item.key === key);

    if (option === undefined) return;
    draft.options = draft.options.filter((item) => item.key !== key);
    if (option.id !== null) draft.removed.push(option);
    editModifierDraft(draft);
  }

  function restoreModifierOption(key: number) {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "modifier-reorder"
    )
      return;
    const draft = copyModifierDraft(current.draft);
    const option = draft.removed.find((item) => item.key === key);

    if (option === undefined) return;
    draft.removed = draft.removed.filter((item) => item.key !== key);
    draft.options.push(option);
    editModifierDraft(draft);
  }

  function moveModifierOption(key: number, direction: -1 | 1) {
    const current = modifierTask.value;

    if (
      !allowed.value ||
      locked.value ||
      current === null ||
      current.kind === "modifier-reorder" ||
      !validModifierOrders(current.draft.options)
    )
      return;
    const draft = copyModifierDraft(current.draft);
    const index = draft.options.findIndex((item) => item.key === key);
    const option = draft.options[index];
    const neighbor = draft.options[index + direction];

    if (option === undefined || neighbor === undefined) return;
    const order = option.sortOrder;

    option.sortOrder = neighbor.sortOrder;
    neighbor.sortOrder = order;
    draft.options.splice(index, 1);
    draft.options.splice(index + direction, 0, option);
    editModifierDraft(draft);
  }

  function moveModifierOrder(id: string, direction: -1 | 1) {
    const current = modifierTask.value;

    if (!allowed.value || locked.value || current?.kind !== "modifier-reorder")
      return;
    const index = current.ids.indexOf(id);

    if (index < 0 || current.ids[index + direction] === undefined) return;
    current.ids.splice(index, 1);
    current.ids.splice(index + direction, 0, id);
  }

  function cancelModifierOmissions() {
    modifierOmissionConfirmation.value = null;
  }

  function saveModifier(confirmedRevision?: number) {
    const current = modifierTask.value;

    if (current === null || locked.value || !allowed.value || session.busy)
      return;
    if (current.kind === "modifier-reorder") {
      if (dirty.value)
        void execute({
          kind: "modifier-reorder",
          baseline: copyModifier(current.baseline),
          ids: [...current.ids],
          label: `Порядок добавок: ${current.baseline.name}`,
        });

      return;
    }

    if (current.kind === "modifier-edit" && !dirty.value) return;
    const validated = modifierFields(
      current.draft,
      current.kind === "modifier-edit" ? current.baseline : undefined,
    );

    modifierValidation.submitted = true;
    modifierValidation.rejected = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
    modifierErrors.value = validated.errors;
    modifierErrorFocus.value = {
      revision: current.revision,
      sequence: ++modifierFocusSequence,
    };
    if (validated.fields === null) return;
    const fields = validated.fields;
    const optionKeys = current.draft.options.map((item) => item.key);

    if (current.kind === "modifier-create") {
      void execute({
        kind: "modifier-create",
        fields,
        optionKeys,
        revision: current.revision,
        label: fields.name,
      });

      return;
    }

    const omitted = current.baseline.options.filter(
      (item) => !fields.options.some((option) => option.id === item.id),
    );

    if (
      omitted.length > 0 &&
      (confirmedRevision !== current.revision ||
        modifierOmissionConfirmation.value?.groupId !== current.baseline.id ||
        modifierOmissionConfirmation.value.revision !== current.revision)
    ) {
      modifierOmissionConfirmation.value = {
        revision: current.revision,
        groupId: current.baseline.id,
        options: omitted.map((item) => ({ ...item })),
      };

      return;
    }

    modifierOmissionConfirmation.value = null;
    void execute({
      kind: "modifier-update",
      fields,
      baseline: copyModifier(current.baseline),
      optionKeys,
      omittedIds: omitted.map((item) => item.id),
      revision: current.revision,
      label: current.baseline.name,
    });
  }

  function confirmModifierOmissions() {
    const confirmation = modifierOmissionConfirmation.value;

    if (confirmation !== null) saveModifier(confirmation.revision);
  }

  function archiveModifier() {
    const current = modifierTask.value;

    if (current?.kind !== "modifier-edit" || dirty.value) return;
    void execute({
      kind: "modifier-archive",
      baseline: copyModifier(current.baseline),
      label: current.baseline.name,
    });
  }

  function isModifierIntent(intent: CatalogIntent): intent is ModifierIntent {
    return (
      intent.kind === "modifier-create" ||
      intent.kind === "modifier-update" ||
      intent.kind === "modifier-archive" ||
      intent.kind === "modifier-reorder"
    );
  }

  function knownModifierFailure(failure: ApiFailure, intent: ModifierIntent) {
    if (failure.kind !== "http") return false;
    const code = failure.response?.code;
    const fields = failure.response?.details?.fields;

    if (failure.status === 400 && code === "VALIDATION_ERROR")
      return (
        Array.isArray(fields) &&
        fields.length > 0 &&
        fields.every(
          (entry) =>
            isRecord(entry) &&
            typeof entry.path === "string" &&
            entry.path !== "" &&
            typeof entry.reason === "string",
        )
      );
    if (intent.kind === "modifier-create") return false;
    if (failure.response?.details !== null) return false;

    return (
      (failure.status === 404 && code === "MODIFIER_GROUP_NOT_FOUND") ||
      (failure.status === 409 &&
        (code === "MODIFIER_GROUP_ARCHIVED" ||
          (intent.kind === "modifier-reorder" &&
            code === "MODIFIER_REORDER_INVALID")))
    );
  }

  function rejectedModifierFields(failure: ApiFailure, intent: ModifierIntent) {
    const invalid: ModifierErrors = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
    const fields = failure.response?.details?.fields;

    if (Array.isArray(fields))
      for (const entry of fields) {
        if (!isRecord(entry) || typeof entry.path !== "string") continue;
        const path = entry.path;
        const nested =
          /^options\.(\d+)(?:\.(name|priceDelta|sortOrder|isDefault|isAvailable|id))?$/.exec(
            path,
          );

        if (Object.hasOwn(modifierFieldErrors, path))
          invalid.fields[path as ModifierField] =
            modifierFieldErrors[path as ModifierField];
        else if (path === "options")
          invalid.optionsMessage = "Проверьте состав добавок";
        else if (
          nested !== null &&
          (intent.kind === "modifier-create" ||
            intent.kind === "modifier-update")
        ) {
          const key = intent.optionKeys[Number(nested[1])];
          const field =
            nested[2] === "id"
              ? "row"
              : ((nested[2] as ModifierOptionField | undefined) ?? "row");

          if (key !== undefined)
            invalid.options[key] = {
              ...invalid.options[key],
              [field]: modifierOptionFieldErrors[field],
            };
          else invalid.form = "Проверьте данные группы";
        } else invalid.form = "Проверьте данные группы";
      }

    modifierValidation.rejected = invalid;
    updateModifierFeedback();
    const current = modifierTask.value;

    if (current !== null && current.kind !== "modifier-reorder")
      modifierErrorFocus.value = {
        revision: current.revision,
        sequence: ++modifierFocusSequence,
      };
  }

  function saveProduct(confirmedRevision?: number) {
    const current = productTask.value;

    if (current === null || locked.value || !allowed.value || session.busy)
      return;
    if (current.kind === "product-reorder") {
      if (dirty.value)
        void execute({
          kind: "product-reorder",
          category: { ...current.category },
          baseline: current.baseline.map(copyProduct),
          ids: [...current.ids],
          label: `Порядок товаров: ${current.category.name}`,
        });

      return;
    }

    if (current.kind === "product-edit" && !dirty.value) return;

    const validated = productFields(
      current.draft,
      data.value?.categories.map((item) => item.id) ?? [],
      current.kind === "product-edit" ? current.baseline : undefined,
    );

    productErrors.value = validated.errors;
    if (validated.fields === null) return;

    const fields = validated.fields;
    const category = data.value?.categories.find(
      (item) => item.id === fields.categoryId,
    );

    if (category === undefined) return;
    const choiceKeys =
      current.draft.mode === "choices"
        ? current.draft.choices.map((choice) => choice.key)
        : [];

    if (current.kind === "product-create") {
      void execute({
        kind: "product-create",
        fields,
        category: { ...category },
        choiceKeys,
        label: fields.name,
      });

      return;
    }

    const omitted = current.baseline.priceChoices.filter(
      (choice) => !fields.priceChoices.some((item) => item.id === choice.id),
    );

    if (
      omitted.length > 0 &&
      (confirmedRevision !== current.revision ||
        omissionConfirmation.value?.productId !== current.baseline.id ||
        omissionConfirmation.value.revision !== current.revision)
    ) {
      omissionConfirmation.value = {
        revision: current.revision,
        productId: current.baseline.id,
        choices: omitted.map((choice) => ({ ...choice })),
      };

      return;
    }

    omissionConfirmation.value = null;
    void execute({
      kind: "product-update",
      fields,
      category: { ...category },
      sourceCategory: { ...current.category },
      baseline: copyProduct(current.baseline),
      choiceKeys,
      omittedIds: omitted.map((choice) => choice.id),
      label: current.baseline.name,
    });
  }

  function confirmProductOmissions() {
    const confirmation = omissionConfirmation.value;

    if (confirmation !== null) saveProduct(confirmation.revision);
  }

  function archiveProduct() {
    const current = productTask.value;

    if (current?.kind !== "product-edit" || dirty.value) return;

    void execute({
      kind: "product-archive",
      sourceCategory: { ...current.category },
      baseline: copyProduct(current.baseline),
      label: current.baseline.name,
    });
  }

  function rejectedProductFields(failure: ApiFailure, intent: ProductIntent) {
    const invalid: ProductErrors = { fields: {}, choices: {}, form: "" };
    const fields = failure.response?.details?.fields;

    if (Array.isArray(fields))
      for (const entry of fields) {
        if (!isRecord(entry) || typeof entry.path !== "string") continue;

        const path = entry.path;
        const nested =
          /^priceChoices\.(\d+)(?:\.(portionLabel|price|sortOrder|isAvailable))?$/.exec(
            path,
          );

        if (Object.hasOwn(productFieldErrors, path)) {
          const field = path as ProductField;

          invalid.fields[field] = productFieldErrors[field];
        } else if (
          nested !== null &&
          (intent.kind === "product-create" || intent.kind === "product-update")
        ) {
          const key = intent.choiceKeys[Number(nested[1])];

          if (key !== undefined) {
            const field = nested[2] as ProductChoiceField | undefined;

            invalid.choices[key] = {
              ...invalid.choices[key],
              [field ?? "row"]: productChoiceFieldErrors[field ?? "row"],
            };
          } else invalid.form = "Проверьте данные товара";
        } else invalid.form = "Проверьте данные товара";
      }

    if (failure.response?.code === "PRODUCT_POSITION_CONFLICT")
      invalid.fields.sortOrder = "Порядок занят активным товаром";
    productErrors.value = invalid;
  }

  function cancelTask() {
    if (locked.value || !allowed.value) return;

    task.value = null;
    resetAssociationFeedback();
    omissionConfirmation.value = null;
    modifierOmissionConfirmation.value = null;
    resetModifierValidation();
    modifierErrors.value = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
    productErrors.value = { fields: {}, choices: {}, form: "" };
    errors.value = {};
    if (operation.value?.status !== "abandoned") operation.value = null;
  }

  function leaveReconciledTask() {
    const original = operation.value;

    if (
      !allowed.value ||
      !fresh.value ||
      original === null ||
      !["reconciled", "reconciled_ambiguous_create"].includes(original.status)
    )
      return;

    operation.value = { ...original, status: "abandoned", message: "" };
    task.value = null;
    resetAssociationFeedback();
    omissionConfirmation.value = null;
    modifierOmissionConfirmation.value = null;
    resetModifierValidation();
    modifierErrors.value = {
      fields: {},
      options: {},
      optionsMessage: "",
      form: "",
    };
    productErrors.value = { fields: {}, choices: {}, form: "" };
    errors.value = {};
  }

  function fieldsFromDraft(draft: CategoryDraft) {
    const invalid: CategoryErrors = {};
    const order = Number(draft.sortOrder);

    if (draft.name.trim() === "") invalid.name = categoryFieldErrors.name;
    if (
      draft.sortOrder.trim() === "" ||
      !Number.isInteger(order) ||
      order < 0 ||
      order > catalogInt32Maximum
    )
      invalid.sortOrder = categoryFieldErrors.sortOrder;

    errors.value = invalid;

    return Object.keys(invalid).length === 0
      ? {
          name: draft.name,
          description: draft.description,
          sortOrder: order,
          isActive: draft.isActive,
        }
      : null;
  }

  function restartReorder() {
    const intent = operation.value?.intent;

    if (
      operation.value?.status === "reconciled" &&
      intent?.kind === "modifier-reorder"
    ) {
      leaveReconciledTask();
      beginModifierReorder(intent.baseline.id);

      return;
    }

    if (
      operation.value?.status === "reconciled" &&
      intent?.kind === "product-reorder"
    ) {
      leaveReconciledTask();
      beginProductReorder(intent.category.id);

      return;
    }

    if (
      operation.value?.status !== "reconciled" ||
      operation.value.intent.kind !== "reorder"
    )
      return;

    leaveReconciledTask();
    beginReorder();
  }

  function isProductIntent(intent: CatalogIntent): intent is ProductIntent {
    return (
      intent.kind === "product-create" ||
      intent.kind === "product-update" ||
      intent.kind === "product-archive" ||
      intent.kind === "product-reorder"
    );
  }

  function resetAssociationFeedback() {
    associationConfirmation.value = null;
    associationErrors.value = { membership: "", category: "", form: "" };
  }

  function associationIntent(current: AssociationTask): AssociationIntent {
    const baseline = copyAssociationBaseline(current.baseline);
    const relevant = new Set([
      ...current.ids,
      ...baseline.links.map((item) => item.groupId),
    ]);

    baseline.groups = baseline.groups.filter((item) => relevant.has(item.id));

    return {
      kind: "category-associations",
      baseline,
      ids: [...current.ids],
      revision: current.revision,
      label: `Группы категории: ${current.baseline.category.name}`,
    };
  }

  function beginAssociations(id: string) {
    if (!canStart() || data.value === null) return;
    const category = data.value.categories.find((item) => item.id === id);
    const links = visibleCategoryLinks(data.value, id);

    if (category === undefined || links === null) {
      error.value = "Не удалось проверить связи категории";
      fresh.value = false;

      return;
    }

    const groups = links.flatMap((link) => {
      const group = modifierAggregate(data.value!, link.groupId);

      return group === null ? [] : [copyModifier(group)];
    });

    resetAssociationFeedback();
    operation.value = null;
    task.value = {
      kind: "category-associations",
      baseline: { category: { ...category }, links, groups },
      ids: links.map((item) => item.groupId),
      revision: 0,
    };
  }

  function canEditAssociations() {
    return (
      allowed.value &&
      !session.busy &&
      !locked.value &&
      fresh.value &&
      associationConfirmation.value === null &&
      associationTask.value !== null
    );
  }

  function associationChanged() {
    const current = associationTask.value;

    if (current === null) return;
    current.revision += 1;
    associationConfirmation.value = null;
    associationErrors.value.membership = "";
  }

  function addAssociation(id: string) {
    const current = associationTask.value;

    if (
      !canEditAssociations() ||
      current === null ||
      data.value === null ||
      current.ids.includes(id)
    )
      return;
    const group = modifierAggregate(data.value, id);

    if (group === null) return;
    if (!current.baseline.links.some((item) => item.groupId === id)) {
      current.baseline.groups = current.baseline.groups.filter(
        (item) => item.id !== id,
      );
      current.baseline.groups.push(copyModifier(group));
    }

    current.ids.push(id);
    associationChanged();
  }

  function removeAssociation(id: string) {
    const current = associationTask.value;

    if (!canEditAssociations() || current === null || !current.ids.includes(id))
      return;
    current.ids = current.ids.filter((item) => item !== id);
    associationChanged();
  }

  function moveAssociation(id: string, direction: -1 | 1) {
    const current = associationTask.value;

    if (!canEditAssociations() || current === null) return;
    const index = current.ids.indexOf(id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= current.ids.length) return;
    [current.ids[index], current.ids[target]] = [
      current.ids[target]!,
      current.ids[index]!,
    ];
    associationChanged();
  }

  function requestAssociationSave() {
    const current = associationTask.value;
    const identity = session.user?.id;

    if (
      !canEditAssociations() ||
      current === null ||
      identity === undefined ||
      data.value === null
    )
      return;
    const intent = associationIntent(current);

    if (!sameAssociationBaseline(intent, data.value)) {
      operation.value = {
        intent,
        status: "conflict",
        message: "Категория или связанные группы изменились",
      };

      return;
    }

    associationConfirmation.value = { intent, access: accessEpoch, identity };
  }

  function cancelAssociationConfirmation() {
    associationConfirmation.value = null;
  }

  function confirmAssociationSave() {
    const confirmation = associationConfirmation.value;
    const current = associationTask.value;

    if (
      confirmation === null ||
      current === null ||
      !allowed.value ||
      session.busy ||
      locked.value ||
      !fresh.value ||
      !currentAccess(confirmation.access, confirmation.identity) ||
      current.revision !== confirmation.intent.revision ||
      current.baseline.category.id !==
        confirmation.intent.baseline.category.id ||
      current.ids.length !== confirmation.intent.ids.length ||
      current.ids.some((id, index) => id !== confirmation.intent.ids[index])
    )
      return;

    associationConfirmation.value = null;
    void execute(confirmation.intent);
  }

  function knownAssociationFailure(failure: ApiFailure) {
    if (failure.status === 404)
      return (
        failure.response?.code === "CATEGORY_NOT_FOUND" &&
        failure.response.details === null
      );
    const fields = failure.response?.details?.fields;

    return (
      failure.status === 400 &&
      failure.response?.code === "VALIDATION_ERROR" &&
      Array.isArray(fields) &&
      fields.length > 0 &&
      fields.every(
        (item) =>
          isRecord(item) &&
          typeof item.path === "string" &&
          item.path.trim() !== "" &&
          typeof item.reason === "string",
      )
    );
  }

  function rejectedAssociationFields(failure: ApiFailure) {
    const fields = failure.response?.details?.fields;
    const invalid: AssociationErrors = {
      membership: "",
      category: "",
      form: "",
    };

    if (Array.isArray(fields))
      for (const item of fields) {
        if (!isRecord(item)) continue;
        if (item.path === "groupIds")
          invalid.membership = "Проверьте выбранные группы";
        else if (item.path === "categoryId")
          invalid.category = "Проверьте исходную категорию";
        else invalid.form = "Не удалось сохранить связи категории";
      }

    associationErrors.value = invalid;
  }

  function baselineMatches(intent: CatalogIntent, catalog: Catalog) {
    if (intent.kind === "category-associations")
      return sameAssociationBaseline(intent, catalog);
    if (isModifierIntent(intent)) {
      if (intent.kind === "modifier-create") return true;
      const current = modifierAggregate(catalog, intent.baseline.id);

      return current !== null && sameModifier(current, intent.baseline);
    }

    if (isProductIntent(intent)) {
      const categoryId =
        intent.kind === "product-create" || intent.kind === "product-update"
          ? intent.fields.categoryId
          : intent.kind === "product-reorder"
            ? intent.category.id
            : intent.baseline.categoryId;
      const category = catalog.categories.find(
        (item) => item.id === categoryId,
      );

      if (category === undefined) return false;
      const expectedCategory =
        intent.kind === "product-archive"
          ? intent.sourceCategory
          : intent.category;

      if (!sameCategoryFields(category, expectedCategory)) return false;
      if (
        intent.kind === "product-update" ||
        intent.kind === "product-archive"
      ) {
        const source = catalog.categories.find(
          (item) => item.id === intent.sourceCategory.id,
        );

        if (
          source === undefined ||
          !sameCategoryFields(source, intent.sourceCategory)
        )
          return false;
      }

      if (intent.kind === "product-create") return true;
      if (intent.kind === "product-reorder") {
        const products = catalog.products.filter(
          (item) => item.categoryId === intent.category.id,
        );

        return (
          sameCategoryFields(category, intent.category) &&
          products.length === intent.baseline.length &&
          products.every(
            (item, index) =>
              intent.baseline[index] !== undefined &&
              sameProduct(item, intent.baseline[index]!),
          )
        );
      }

      const current = catalog.products.find(
        (item) => item.id === intent.baseline.id,
      );

      return current !== undefined && sameProduct(current, intent.baseline);
    }

    const categories = catalog.categories;

    if (intent.kind === "create") return true;
    if (intent.kind === "reorder")
      return (
        categories.length === intent.baseline.length &&
        categories.every(
          (item, index) =>
            item.id === intent.baseline[index]?.id &&
            sameCategoryFields(item, intent.baseline[index]!),
        )
      );

    const current = categories.find((item) => item.id === intent.baseline.id);

    return (
      current !== undefined && sameCategoryFields(current, intent.baseline)
    );
  }

  function rejectedFields(failure: ApiFailure) {
    const fields = failure.response?.details?.fields;
    const invalid: CategoryErrors = {};

    if (Array.isArray(fields)) {
      for (const entry of fields) {
        if (!isRecord(entry)) continue;

        const path = entry.path;

        if (
          path === "name" ||
          path === "description" ||
          path === "sortOrder" ||
          path === "isActive"
        )
          invalid[path] = categoryFieldErrors[path];
      }
    }

    if (failure.response?.code === "CATEGORY_POSITION_CONFLICT")
      invalid.sortOrder = "Порядок занят активной категорией";

    errors.value = invalid;
  }

  async function execute(intent: CatalogIntent) {
    if (
      !allowed.value ||
      session.busy ||
      !fresh.value ||
      locked.value ||
      data.value === null
    )
      return;

    cancelRead();
    const access = accessEpoch;
    const identity = session.user?.id;
    const version = ++operationEpoch;
    const controller = new AbortController();
    let sent = false;

    preflight = controller;
    operation.value = {
      intent,
      status: "checking",
      message: "Проверяем каталог",
    };

    try {
      const current = await session.authenticatedGet((token) => {
        guardAccess(access, identity);

        return readCatalog(token, controller.signal);
      });

      if (
        !currentAccess(access, identity) ||
        version !== operationEpoch ||
        controller.signal.aborted
      )
        return;

      data.value = current;
      fresh.value = true;
      error.value = "";
      if (!baselineMatches(intent, current)) {
        operation.value = {
          intent,
          status: "conflict",
          message: isProductIntent(intent)
            ? "Товар или категория изменились"
            : isModifierIntent(intent)
              ? "Группа или состав добавок изменились"
              : intent.kind === "reorder"
                ? "Список категорий изменился"
                : "Категория изменилась",
        };

        return;
      }

      const response =
        await session.authenticatedCommand<CatalogCommandResponse>((token) => {
          guardAccess(access, identity);
          if (version !== operationEpoch) throw new ApiFailure("aborted");

          operation.value = {
            intent,
            status: "sending",
            message:
              intent.kind === "modifier-archive"
                ? "Архивируем группу"
                : intent.kind === "product-archive"
                  ? "Архивируем товар"
                  : intent.kind === "archive"
                    ? "Архивируем категорию"
                    : "Сохраняем изменения",
          };
          sent = true;
          mutationEpoch.value += 1;

          return intent.kind === "category-associations"
            ? writeCategoryAssociations(token, intent).then((value) => ({
                target: "association" as const,
                value,
              }))
            : isModifierIntent(intent)
              ? writeModifier(token, intent, current).then((value) => ({
                  target: "modifier" as const,
                  value,
                }))
              : isProductIntent(intent)
                ? writeProduct(token, intent, current).then((value) => ({
                    target: "product" as const,
                    value,
                  }))
                : writeCategory(
                    token,
                    intent,
                    current.categories.map((item) => item.id),
                  ).then((value) => ({ target: "category" as const, value }));
        });

      if (!currentAccess(access, identity) || version !== operationEpoch)
        return;

      if (
        response.target === "association" &&
        intent.kind === "category-associations"
      ) {
        data.value.categoryModifierGroups = [
          ...data.value.categoryModifierGroups.filter(
            (item) => item.categoryId !== intent.baseline.category.id,
          ),
          ...response.value,
        ];
        fresh.value = false;
        confirmedCategoryId.value = intent.baseline.category.id;
      } else if (response.target === "modifier") {
        if (intent.kind === "modifier-archive") {
          fresh.value = false;
          confirmedModifierId.value = null;
        } else if (Array.isArray(response.value)) {
          const ids = new Set(response.value.map((item) => item.id));

          data.value.modifierOptions = [
            ...data.value.modifierOptions.filter((item) => !ids.has(item.id)),
            ...response.value,
          ];
        } else if (response.value !== null) {
          const { options, ...group } = response.value;

          confirmedModifierId.value = group.id;
          data.value.modifierGroups = [
            ...data.value.modifierGroups.filter((item) => item.id !== group.id),
            group,
          ];
          data.value.modifierOptions = [
            ...data.value.modifierOptions.filter(
              (item) => item.groupId !== group.id,
            ),
            ...options,
          ];
        }
      } else if (response.target === "product") {
        if (intent.kind === "product-archive") {
          data.value.products = data.value.products.filter(
            (item) => item.id !== intent.baseline.id,
          );
          fresh.value = false;
          confirmedProductId.value = null;
        } else if (Array.isArray(response.value)) {
          const ids = new Set(response.value.map((item) => item.id));

          data.value.products = [
            ...data.value.products.filter((item) => !ids.has(item.id)),
            ...response.value,
          ].sort(
            (left, right) =>
              left.categoryId.localeCompare(right.categoryId) ||
              left.sortOrder - right.sortOrder ||
              left.id.localeCompare(right.id),
          );
          confirmedProductId.value = null;
        } else if (response.value !== null) {
          const product = response.value;

          confirmedProductId.value = product.id;
          data.value.products = [
            ...data.value.products.filter((item) => item.id !== product.id),
            product,
          ].sort(
            (left, right) =>
              left.categoryId.localeCompare(right.categoryId) ||
              left.sortOrder - right.sortOrder ||
              left.id.localeCompare(right.id),
          );
        }
      } else if (response.target === "category" && intent.kind === "archive") {
        data.value.categories = data.value.categories.filter(
          (item) => item.id !== intent.baseline.id,
        );
        // Related products/links remain last-confirmed until a complete new GET.
        fresh.value = false;
        confirmedCategoryId.value = null;
      } else if (
        response.target === "category" &&
        Array.isArray(response.value)
      ) {
        data.value.categories = response.value;
      } else if (
        response.target === "category" &&
        response.value !== null &&
        !Array.isArray(response.value)
      ) {
        const category = response.value;

        confirmedCategoryId.value = category.id;
        data.value.categories = [
          ...data.value.categories.filter((item) => item.id !== category.id),
          category,
        ].sort(
          (left, right) =>
            left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
        );
      }

      operation.value = {
        intent,
        status: "completed",
        message:
          intent.kind === "modifier-archive"
            ? "Группа архивирована"
            : intent.kind === "modifier-create"
              ? "Группа создана"
              : intent.kind === "modifier-reorder"
                ? "Порядок сохранён"
                : intent.kind === "product-archive"
                  ? "Товар архивирован"
                  : intent.kind === "product-create"
                    ? "Товар создан"
                    : intent.kind === "product-reorder"
                      ? "Порядок сохранён"
                      : intent.kind === "archive"
                        ? "Категория архивирована"
                        : intent.kind === "create"
                          ? "Категория создана"
                          : intent.kind === "reorder"
                            ? "Порядок сохранён"
                            : "Изменения сохранены",
      };
      task.value = null;
      resetAssociationFeedback();
      omissionConfirmation.value = null;
      modifierOmissionConfirmation.value = null;
      resetModifierValidation();
      modifierErrors.value = {
        fields: {},
        options: {},
        optionsMessage: "",
        form: "",
      };
      productErrors.value = { fields: {}, choices: {}, form: "" };
      errors.value = {};
    } catch (failure) {
      if (!currentAccess(access, identity) || version !== operationEpoch)
        return;

      const code =
        failure instanceof ApiFailure ? failure.response?.code : null;
      const known =
        failure instanceof ApiFailure &&
        failure.kind === "http" &&
        (intent.kind === "category-associations"
          ? knownAssociationFailure(failure)
          : isModifierIntent(intent)
            ? knownModifierFailure(failure, intent)
            : (failure.status === 400 && code === "VALIDATION_ERROR") ||
              (failure.status === 404 &&
                [
                  "CATEGORY_NOT_FOUND",
                  "PRODUCT_NOT_FOUND",
                  "PRODUCT_CATEGORY_NOT_FOUND",
                ].includes(code ?? "")) ||
              (failure.status === 409 &&
                [
                  "CATEGORY_ARCHIVED",
                  "CATEGORY_POSITION_CONFLICT",
                  "CATEGORY_REORDER_INVALID",
                  "PRODUCT_ARCHIVED",
                  "PRODUCT_POSITION_CONFLICT",
                  "PRODUCT_REORDER_INVALID",
                ].includes(code ?? "")));
      const absent =
        intent.kind === "category-associations"
          ? known && code === "CATEGORY_NOT_FOUND"
          : isModifierIntent(intent)
            ? known &&
              ["MODIFIER_GROUP_NOT_FOUND", "MODIFIER_GROUP_ARCHIVED"].includes(
                code ?? "",
              )
            : [
                "CATEGORY_NOT_FOUND",
                "CATEGORY_ARCHIVED",
                "PRODUCT_NOT_FOUND",
                "PRODUCT_CATEGORY_NOT_FOUND",
                "PRODUCT_ARCHIVED",
              ].includes(code ?? "");
      const conflict =
        intent.kind === "category-associations"
          ? false
          : isModifierIntent(intent)
            ? known && code === "MODIFIER_REORDER_INVALID"
            : code === "CATEGORY_REORDER_INVALID";

      fresh.value = false;
      if (known && failure instanceof ApiFailure) {
        if (intent.kind === "category-associations")
          rejectedAssociationFields(failure);
        else if (isModifierIntent(intent))
          rejectedModifierFields(failure, intent);
        else if (isProductIntent(intent))
          rejectedProductFields(failure, intent);
        else rejectedFields(failure);
      }

      operation.value = {
        intent,
        status:
          sent && !known
            ? "unknown"
            : absent
              ? "absent"
              : conflict
                ? "conflict"
                : sent
                  ? "rejected"
                  : "conflict",
        message:
          sent && !known
            ? "Результат изменения не подтверждён"
            : absent
              ? isModifierIntent(intent)
                ? "Группа недоступна"
                : isProductIntent(intent)
                  ? "Товар или категория недоступны"
                  : "Категория недоступна"
              : conflict
                ? isModifierIntent(intent)
                  ? "Состав добавок изменился"
                  : "Список категорий изменился"
                : sent
                  ? "Проверьте введённые данные"
                  : "Не удалось проверить каталог",
      };
    } finally {
      if (preflight === controller) preflight = null;
      // Even a revoked late settlement can have committed; never expose its result.
      if (sent) mutationEpoch.value += 1;
    }
  }

  function save() {
    const current = categoryTask.value;

    if (current === null || locked.value) return;
    if (current.kind === "reorder") {
      if (dirty.value)
        void execute({
          kind: "reorder",
          baseline: current.baseline.map((item) => ({ ...item })),
          ids: [...current.ids],
          label: "Порядок категорий",
        });

      return;
    }

    if (current.kind === "edit" && !dirty.value) return;

    const fields = fieldsFromDraft(current.draft);

    if (fields === null) return;

    void execute(
      current.kind === "create"
        ? { kind: "create", fields, label: fields.name }
        : {
            kind: "update",
            fields,
            baseline: { ...current.baseline },
            label: current.baseline.name,
          },
    );
  }

  function archive() {
    const current = categoryTask.value;

    if (current?.kind !== "edit" || dirty.value) return;

    void execute({
      kind: "archive",
      baseline: { ...current.baseline },
      label: current.baseline.name,
    });
  }

  async function reconcile() {
    const original = operation.value;

    if (
      !allowed.value ||
      session.busy ||
      !locked.value ||
      busy.value ||
      original === null ||
      recovery !== null
    )
      return;

    cancelRead();
    const controller = new AbortController();
    const version = operationEpoch;
    const access = accessEpoch;
    const identity = session.user?.id;

    recovery = controller;
    operation.value = {
      ...original,
      status: "reconciling",
      message: "Проверяем каталог",
    };

    try {
      const current = await session.authenticatedGet((token) => {
        guardAccess(access, identity);

        return readCatalog(token, controller.signal);
      });

      if (
        !currentAccess(access, identity) ||
        version !== operationEpoch ||
        controller.signal.aborted
      )
        return;

      const recoveryIntent = original.intent;

      if (
        recoveryIntent.kind === "category-associations" &&
        current.categories.some(
          (item) => item.id === recoveryIntent.baseline.category.id,
        ) &&
        visibleCategoryLinks(current, recoveryIntent.baseline.category.id) ===
          null
      )
        throw new ApiFailure("contract");

      data.value = current;
      fresh.value = true;
      error.value = "";
      operation.value = {
        ...original,
        status:
          original.intent.kind === "create" ||
          original.intent.kind === "modifier-create" ||
          original.intent.kind === "product-create"
            ? "reconciled_ambiguous_create"
            : "reconciled",
        message:
          original.intent.kind === "create" ||
          original.intent.kind === "modifier-create" ||
          original.intent.kind === "product-create"
            ? "Исход создания не подтверждён"
            : "Текущий каталог получен",
      };
    } catch {
      if (
        currentAccess(access, identity) &&
        version === operationEpoch &&
        !controller.signal.aborted
      ) {
        fresh.value = false;
        operation.value = {
          ...original,
          message: "Не удалось проверить каталог",
        };
      }
    } finally {
      if (recovery === controller) recovery = null;
    }
  }

  return {
    associationTask: computed(() =>
      associationTask.value === null ? null : readonly(associationTask.value),
    ),
    associationConfirmation: computed(() =>
      associationConfirmation.value === null
        ? null
        : readonly(associationConfirmation.value),
    ),
    associationErrors: computed(() => readonly(associationErrors.value)),
    beginAssociations,
    addAssociation,
    removeAssociation,
    moveAssociation,
    requestAssociationSave,
    confirmAssociationSave,
    cancelAssociationConfirmation,
    data: computed(() => (data.value === null ? null : readonly(data.value))),
    task: computed(() => (task.value === null ? null : readonly(task.value))),
    operation: computed(() =>
      operation.value === null ? null : readonly(operation.value),
    ),
    categoryTask: computed(() =>
      categoryTask.value === null ? null : readonly(categoryTask.value),
    ),
    productTask: computed(() =>
      productTask.value === null ? null : readonly(productTask.value),
    ),
    errors: computed(() => readonly(errors.value)),
    productErrors: computed(() => readonly(productErrors.value)),
    omissionConfirmation: computed(() =>
      omissionConfirmation.value === null
        ? null
        : readonly(omissionConfirmation.value),
    ),
    confirmedProductId: computed(() => confirmedProductId.value),
    modifierTask: computed(() =>
      modifierTask.value === null ? null : readonly(modifierTask.value),
    ),
    modifierErrors: computed(() => readonly(modifierErrors.value)),
    modifierErrorFocus: computed(() =>
      modifierErrorFocus.value === null
        ? null
        : readonly(modifierErrorFocus.value),
    ),
    validateModifier,
    modifierOmissionConfirmation: computed(() =>
      modifierOmissionConfirmation.value === null
        ? null
        : readonly(modifierOmissionConfirmation.value),
    ),
    confirmedModifierId: computed(() => confirmedModifierId.value),
    beginModifierCreate,
    beginModifierEdit,
    beginModifierReorder,
    editModifierDraft,
    addModifierOption,
    removeModifierOption,
    restoreModifierOption,
    moveModifierOption,
    moveModifierOrder,
    saveModifier,
    confirmModifierOmissions,
    cancelModifierOmissions,
    archiveModifier,
    beginProductCreate,
    beginProductEdit,
    beginProductReorder,
    editProductDraft,
    setProductMode,
    addChoice,
    removeChoice,
    restoreChoice,
    moveChoice,
    moveProduct,
    saveProduct,
    confirmProductOmissions,
    cancelProductOmissions,
    archiveProduct,
    allowed,
    locked,
    busy,
    dirty,
    fresh: computed(() => fresh.value),
    loading: computed(() => pending.value),
    error: computed(() => error.value),
    mutationEpoch: computed(() => mutationEpoch.value),
    confirmedCategoryId: computed(() => confirmedCategoryId.value),
    refresh,
    cancelRead,
    clear,
    beginCreate,
    beginEdit,
    beginReorder,
    editDraft,
    move,
    cancelTask,
    leaveReconciledTask,
    restartReorder,
    save,
    archive,
    reconcile,
  };
});
