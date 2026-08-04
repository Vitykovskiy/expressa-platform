import { acceptsNewOrders } from '../domain/catalog.constants';
import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductVariantCandidate,
  PublicMenu,
  PublicMenuModifierGroup,
  PublicMenuModifierOption,
  PublicMenuProduct,
  PublicMenuProductVariant,
} from '../domain/catalog.types';
import type { PublicMenuCandidates, PublicMenuRepository } from './public-menu.repository.types';

export class GetPublicMenuUseCase {
  constructor(private readonly repository: PublicMenuRepository) {}

  async execute(): Promise<PublicMenu> {
    const candidates = await this.repository.findCandidates();
    const publishableGroups = createPublishableModifierGroups(candidates);

    return {
      acceptsNewOrders,
      categories: candidates.categories
        .filter(isPublishedCatalogEntity)
        .map((category) => createCategory(category, candidates, publishableGroups))
        .filter((category) => category.products.length > 0),
    };
  }
}

function createCategory(
  category: CatalogCategoryCandidate,
  candidates: PublicMenuCandidates,
  publishableGroups: Map<string, PublicMenuModifierGroup>,
) {
  const { modifierGroups, hasInvalidGroup } = getCategoryModifierGroups(
    category.id,
    candidates.categoryModifierGroups,
    candidates.modifierGroups,
    publishableGroups,
  );
  const hasInvalidRequiredGroup = modifierGroups.some((group) => !isValidRequiredGroup(group));

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    products: hasInvalidGroup || hasInvalidRequiredGroup
      ? []
      : candidates.products
          .filter((product) => product.categoryId === category.id)
          .filter(isPublishedCatalogEntity)
          .flatMap((product) => createProduct(product, candidates.productVariants, modifierGroups)),
  };
}

function createProduct(
  product: CatalogProductCandidate,
  variants: CatalogProductVariantCandidate[],
  modifierGroups: PublicMenuModifierGroup[],
): PublicMenuProduct[] {
  const productVariants = variants
    .filter((variant) => variant.productId === product.id)
    .filter(isCurrentCatalogEntity)
    .map(toPublicVariant);

  if (product.type === 'DRINK') {
    if (product.priceMinor !== null || !productVariants.some((variant) => variant.isAvailable)) {
      return [];
    }

    return [{ ...toPublicProduct(product), priceMinor: null, variants: productVariants, modifierGroups }];
  }

  if (product.priceMinor === null || productVariants.length > 0) {
    return [];
  }

  return [{ ...toPublicProduct(product), variants: [], modifierGroups }];
}

function createPublishableModifierGroups(candidates: PublicMenuCandidates) {
  return new Map(
    candidates.modifierGroups
      .filter(isPublishedCatalogEntity)
      .flatMap((group) => createModifierGroup(group, candidates.modifierOptions)),
  );
}

function createModifierGroup(
  group: CatalogModifierGroupCandidate,
  options: CatalogModifierOptionCandidate[],
): [string, PublicMenuModifierGroup][] {
  const publicOptions = options
    .filter((option) => option.groupId === group.id)
    .filter(isCurrentCatalogEntity)
    .map(toPublicModifierOption);
  const publicGroup: PublicMenuModifierGroup = {
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: publicOptions,
  };

  return isValidModifierGroup(publicGroup) ? [[group.id, publicGroup]] : [];
}

function getCategoryModifierGroups(
  categoryId: string,
  assignments: CatalogCategoryModifierGroupCandidate[],
  candidates: CatalogModifierGroupCandidate[],
  groups: Map<string, PublicMenuModifierGroup>,
): { modifierGroups: PublicMenuModifierGroup[]; hasInvalidGroup: boolean } {
  const activeGroups = new Map(
    candidates.filter(isPublishedCatalogEntity).map((candidate) => [candidate.id, candidate]),
  );
  const modifierGroups: PublicMenuModifierGroup[] = [];
  let hasInvalidGroup = false;

  for (const assignment of assignments.filter((item) => item.categoryId === categoryId)) {
    if (!activeGroups.has(assignment.groupId)) {
      continue;
    }

    const group = groups.get(assignment.groupId);
    if (group === undefined) {
      hasInvalidGroup = true;
      continue;
    }

    modifierGroups.push(group);
  }

  return { modifierGroups, hasInvalidGroup };
}

function isPublishedCatalogEntity(candidate: { isActive: boolean; archivedAt: Date | null }): boolean {
  return candidate.isActive && candidate.archivedAt === null;
}

function isCurrentCatalogEntity(candidate: { archivedAt: Date | null }): boolean {
  return candidate.archivedAt === null;
}

function isValidModifierGroup(group: PublicMenuModifierGroup): boolean {
  if (
    !Number.isInteger(group.minSelect) ||
    !Number.isInteger(group.maxSelect) ||
    group.minSelect < 0 ||
    group.maxSelect < group.minSelect ||
    (group.selectionType === 'single' && group.maxSelect !== 1)
  ) {
    return false;
  }

  return group.options.every((option) => Number.isInteger(option.priceDeltaMinor));
}

function isValidRequiredGroup(group: PublicMenuModifierGroup): boolean {
  if (group.minSelect === 0) {
    return true;
  }

  const availableOptions = group.options.filter((option) => option.isAvailable);
  const defaultOptions = availableOptions.filter((option) => option.isDefault);

  return (
    availableOptions.length >= group.minSelect &&
    defaultOptions.length >= group.minSelect &&
    defaultOptions.length <= group.maxSelect &&
    defaultOptions.every((option) => option.priceDeltaMinor === 0)
  );
}

function toPublicProduct(product: CatalogProductCandidate): Omit<PublicMenuProduct, 'variants' | 'modifierGroups'> {
  return {
    id: product.id,
    type: product.type,
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    isAvailable: product.isAvailable,
  };
}

function toPublicVariant(variant: CatalogProductVariantCandidate): PublicMenuProductVariant {
  return {
    id: variant.id,
    size: variant.size,
    priceMinor: variant.priceMinor,
    isAvailable: variant.isAvailable,
  };
}

function toPublicModifierOption(option: CatalogModifierOptionCandidate): PublicMenuModifierOption {
  return {
    id: option.id,
    name: option.name,
    priceDeltaMinor: option.priceDeltaMinor,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
  };
}
