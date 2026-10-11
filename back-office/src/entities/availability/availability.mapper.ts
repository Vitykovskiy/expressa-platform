import type { Availability, AvailabilityDto } from "./availability.types";

export function mapAvailability(dto: AvailabilityDto): Availability {
  const categories = [...dto.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      label: category.name,
      inactive: !category.isActive,
      products: dto.products
        .filter((product) => product.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((product) => ({
          kind: "product" as const,
          id: product.id,
          label: product.name,
          isAvailable: product.isAvailable,
          price: product.price,
          inactive: !product.isActive,
          choices: dto.priceChoices
            .filter((choice) => choice.productId === product.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((choice) => ({
              kind: "price_choice" as const,
              id: choice.id,
              label: choice.portionLabel,
              isAvailable: choice.isAvailable,
              price: choice.price,
              inactive: false,
            })),
        })),
    }));
  const groups = dto.modifierGroups.map((group) => {
    const categoryIds = dto.categoryModifierGroups
      .filter((link) => link.groupId === group.id)
      .map((link) => link.categoryId);
    const directIds = dto.productModifierGroups
      .filter((link) => link.groupId === group.id)
      .map((link) => link.productId);

    return {
      id: group.id,
      label: group.name,
      inactive: !group.isActive,
      categoryIds,
      products: categories.flatMap((category) =>
        category.products
          .filter(
            (product) =>
              categoryIds.includes(category.id) ||
              directIds.includes(product.id),
          )
          .map((product) => ({
            id: product.id,
            categoryId: category.id,
            categoryLabel: category.label,
            label: product.label,
          })),
      ),
      options: dto.modifierOptions
        .filter((option) => option.groupId === group.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({
          kind: "modifier" as const,
          id: option.id,
          label: option.name,
          isAvailable: option.isAvailable,
          price: option.priceDelta,
          inactive: false,
        })),
    };
  });

  return { categories, groups, intake: { ...dto.intake } };
}
