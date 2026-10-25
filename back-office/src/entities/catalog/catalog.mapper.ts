import type {
  CatalogData,
  CatalogListGroup,
  CatalogProduct,
} from "./catalog.types";

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
          priceLabel: formatProductPrice(product),
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

function formatProductPrice(product: CatalogProduct): string {
  if (product.price !== null) {
    return `${product.price} ₽`;
  }

  return [...product.priceChoices]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((choice) => `${choice.portionLabel}: ${choice.price} ₽`)
    .join(" · ");
}

export function countLabel(
  count: number,
  forms: readonly [string, string, string],
): string {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} ${forms[2]}`;
  }

  if (last === 1) {
    return `${count} ${forms[0]}`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} ${forms[1]}`;
  }

  return `${count} ${forms[2]}`;
}
