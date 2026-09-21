import { computed, ref, type Ref } from "vue";

import type { Category, Product } from "../catalog.types";
import type {
  MenuReorderDraft,
  MenuReorderScope,
} from "./useMenuReorderDraft.types";

function orderedIds<T extends { id: string; sortOrder: number }>(
  items: readonly T[],
): string[] {
  return [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.id);
}

export function useMenuReorderDraft(
  categories: Ref<readonly Category[]>,
  products: Ref<readonly Product[]>,
) {
  const original = ref<MenuReorderDraft>({
    categoryIds: [],
    productIdsByCategory: {},
  });
  const draft = ref<MenuReorderDraft>({
    categoryIds: [],
    productIdsByCategory: {},
  });

  function reset(): void {
    const categoryIds = orderedIds(categories.value);
    const productIdsByCategory = Object.fromEntries(
      categoryIds.map((categoryId) => [
        categoryId,
        orderedIds(
          products.value.filter((product) => product.categoryId === categoryId),
        ),
      ]),
    );
    const snapshot = { categoryIds, productIdsByCategory };
    original.value = snapshot;
    draft.value = {
      categoryIds: [...categoryIds],
      productIdsByCategory: { ...productIdsByCategory },
    };
  }

  function move(scope: string | null, id: string, offset: -1 | 1): boolean {
    const ids =
      scope === null
        ? draft.value.categoryIds
        : (draft.value.productIdsByCategory[scope] ?? []);
    const index = ids.indexOf(id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= ids.length) return false;
    const next = [...ids];
    [next[index], next[target]] = [next[target]!, next[index]!];
    draft.value =
      scope === null
        ? { ...draft.value, categoryIds: next }
        : {
            ...draft.value,
            productIdsByCategory: {
              ...draft.value.productIdsByCategory,
              [scope]: next,
            },
          };
    return true;
  }

  const dirtyScopes = computed<MenuReorderScope[]>(() => {
    const scopes: MenuReorderScope[] = [];
    if (
      draft.value.categoryIds.join("|") !== original.value.categoryIds.join("|")
    ) {
      scopes.push({
        categoryId: null,
        ids: draft.value.categoryIds,
        originalIds: original.value.categoryIds,
      });
    }
    for (const categoryId of draft.value.categoryIds) {
      const ids = draft.value.productIdsByCategory[categoryId] ?? [];
      const originalIds = original.value.productIdsByCategory[categoryId] ?? [];
      if (ids.join("|") !== originalIds.join("|"))
        scopes.push({ categoryId, ids, originalIds });
    }
    return scopes;
  });

  return { draft, dirtyScopes, move, reset };
}
