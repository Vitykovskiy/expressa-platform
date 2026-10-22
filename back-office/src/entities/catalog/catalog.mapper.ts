import type { CatalogData, CatalogListGroup } from "./catalog.types";

export function mapCatalogLists(data: CatalogData): {
  categories: readonly CatalogListGroup[];
  optionGroups: readonly CatalogListGroup[];
} {
  const categories = [...data.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const products = data.products
        .filter((product) => product.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        id: category.id,
        name: category.name,
        countLabel: countLabel(products.length, ["товар", "товара", "товаров"]),
        items: products.map((product) => ({
          kind: "product" as const,
          id: product.id,
          name: product.name,
          priceLabel:
            product.price === null
              ? [...product.priceChoices]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((choice) => `${choice.portionLabel}: ${choice.price} ₽`)
                  .join(" · ")
              : `${product.price} ₽`,
        })),
      };
    });
  const optionGroups = data.modifierGroups.map((group) => {
    const options = data.modifierOptions
      .filter((option) => option.groupId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      id: group.id,
      name: group.name,
      countLabel: countLabel(options.length, ["опция", "опции", "опций"]),
      items: options.map((option) => ({
        kind: "option" as const,
        id: option.id,
        name: option.name,
        priceLabel:
          option.priceDelta === 0 ? "Бесплатно" : `${option.priceDelta} ₽`,
      })),
    };
  });

  return { categories, optionGroups };
}

export function countLabel(
  count: number,
  forms: readonly [string, string, string],
): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? forms[2]
      : last === 1
        ? forms[0]
        : last >= 2 && last <= 4
          ? forms[1]
          : forms[2];

  return `${count} ${word}`;
}
