import type { DeepReadonly } from "vue";
import type { Availability } from "./availability.types";

export function filterProducts(
  data: DeepReadonly<Availability>,
  search: string,
  categoryId: string | null,
) {
  const query = search.trim().toLocaleLowerCase("ru-RU");

  return data.categories
    .filter((category) => categoryId === null || category.id === categoryId)
    .map((category) => ({
      ...category,
      products: category.products
        .map((product) => {
          const full =
            product.label.toLocaleLowerCase("ru-RU").includes(query) ||
            category.label.toLocaleLowerCase("ru-RU").includes(query);
          const choices = full
            ? product.choices
            : product.choices.filter((choice) =>
                choice.label.toLocaleLowerCase("ru-RU").includes(query),
              );

          return full || choices.length ? { ...product, choices } : null;
        })
        .filter((product) => product !== null),
    }))
    .filter((category) => category.products.length);
}

export function filterGroups(
  data: DeepReadonly<Availability>,
  search: string,
  categoryId: string | null,
) {
  const query = search.trim().toLocaleLowerCase("ru-RU");

  return data.groups
    .filter(
      (group) =>
        categoryId === null ||
        group.categoryIds.includes(categoryId) ||
        group.products.some((product) => product.categoryId === categoryId),
    )
    .map((group) => {
      const categoryMatch = data.categories.some(
        (category) =>
          group.categoryIds.includes(category.id) &&
          category.label.toLocaleLowerCase("ru-RU").includes(query),
      );
      const full =
        group.label.toLocaleLowerCase("ru-RU").includes(query) ||
        categoryMatch ||
        group.products.some(
          (product) =>
            product.label.toLocaleLowerCase("ru-RU").includes(query) ||
            product.categoryLabel.toLocaleLowerCase("ru-RU").includes(query),
        );
      const options = full
        ? group.options
        : group.options.filter((option) =>
            option.label.toLocaleLowerCase("ru-RU").includes(query),
          );

      return full || options.length ? { ...group, options } : null;
    })
    .filter((group) => group !== null);
}
