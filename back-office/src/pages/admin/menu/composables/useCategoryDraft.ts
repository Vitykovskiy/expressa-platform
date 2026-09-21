import { computed, shallowRef } from "vue";
import type { CategoryFormData } from "../AddCategoryDialog.types";
import type {
  CategoryDraftValidation,
  UseCategoryDraftOptions,
} from "./useCategoryDraft.types";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function useCategoryDraft(options: UseCategoryDraftOptions) {
  const name = shallowRef("");
  const description = shallowRef("");
  const isActive = shallowRef(true);
  const baseline = shallowRef<CategoryFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  const normalizedName = computed(() => normalizeName(name.value));
  const normalizedDescription = computed(() => description.value.trim());
  const validation = computed<CategoryDraftValidation>(() => ({
    name: !normalizedName.value
      ? "Введите название категории"
      : normalizedName.value.length > 80
        ? "Название должно содержать от 1 до 80 символов"
        : options
              .categories()
              .some(
                (category) =>
                  category.id !== options.excludedCategoryId?.() &&
                  normalizeName(category.name).toLocaleLowerCase("ru") ===
                    normalizedName.value.toLocaleLowerCase("ru"),
              )
          ? "Категория с таким названием уже существует"
          : undefined,
    description:
      description.value.length > 240
        ? "Описание должно быть не длиннее 240 символов"
        : undefined,
  }));
  const data = computed<CategoryFormData>(() => ({
    name: normalizedName.value,
    description: normalizedDescription.value,
    isActive: isActive.value,
  }));
  const isValid = computed(
    () => !validation.value.name && !validation.value.description,
  );
  const isDirty = computed(
    () =>
      data.value.name !== baseline.value.name ||
      data.value.description !== baseline.value.description ||
      data.value.isActive !== baseline.value.isActive,
  );

  function reset(): void {
    const initial = options.initial();
    baseline.value = {
      name: normalizeName(initial.name),
      description: initial.description.trim(),
      isActive: initial.isActive,
    };
    name.value = baseline.value.name;
    description.value = baseline.value.description;
    isActive.value = baseline.value.isActive;
  }

  return {
    data,
    description,
    isActive,
    isDirty,
    isValid,
    name,
    reset,
    validation,
  };
}
