import type { DeepReadonly } from "vue";
import { catalogInt32Maximum } from "./catalog.constants";
import { sameCategoryFields } from "./catalog.mapper";
import {
  copyModifier,
  modifierAggregate,
  sameModifier,
} from "./modifier.mapper";
import type {
  AssociationBaseline,
  AssociationIntent,
  Catalog,
  CatalogLinkDto,
} from "./catalog.types";

export function visibleCategoryLinks(
  catalog: DeepReadonly<Catalog>,
  categoryId: string,
): CatalogLinkDto[] | null {
  if (!catalog.categories.some((item) => item.id === categoryId)) return null;
  const links = catalog.categoryModifierGroups.filter(
    (item) => item.categoryId === categoryId,
  );
  const ids = new Set(links.map((item) => item.groupId));
  const orders = new Set(links.map((item) => item.sortOrder));

  if (
    ids.size !== links.length ||
    orders.size !== links.length ||
    links.some(
      (item) =>
        !Number.isInteger(item.sortOrder) ||
        item.sortOrder < 0 ||
        item.sortOrder > catalogInt32Maximum ||
        !catalog.modifierGroups.some((group) => group.id === item.groupId),
    )
  )
    return null;

  return links
    .map((item) => ({ ...item }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function copyAssociationBaseline(
  baseline: DeepReadonly<AssociationBaseline>,
): AssociationBaseline {
  return {
    category: { ...baseline.category },
    links: baseline.links.map((item) => ({ ...item })),
    groups: baseline.groups.map(copyModifier),
  };
}

export function sameAssociationBaseline(
  intent: DeepReadonly<AssociationIntent>,
  catalog: DeepReadonly<Catalog>,
) {
  const category = catalog.categories.find(
    (item) => item.id === intent.baseline.category.id,
  );
  const links = visibleCategoryLinks(catalog, intent.baseline.category.id);

  return (
    category !== undefined &&
    sameCategoryFields(category, intent.baseline.category) &&
    links !== null &&
    links.length === intent.baseline.links.length &&
    links.every(
      (item, index) =>
        item.categoryId === intent.baseline.links[index]?.categoryId &&
        item.groupId === intent.baseline.links[index]?.groupId &&
        item.sortOrder === intent.baseline.links[index]?.sortOrder,
    ) &&
    new Set(intent.ids).size === intent.ids.length &&
    intent.ids.every((id) =>
      catalog.modifierGroups.some((item) => item.id === id),
    ) &&
    intent.baseline.groups.every((group) => {
      const current = modifierAggregate(catalog, group.id);

      return current !== null && sameModifier(current, group);
    })
  );
}
