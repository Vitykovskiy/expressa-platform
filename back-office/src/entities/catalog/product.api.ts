import { contractFailure, request } from "../../shared/api/transport";
import { productEndpoint } from "./catalog.constants";
import { sameCategoryFields } from "./catalog.mapper";
import { normalizePortion, sameProduct } from "./product.mapper";
import { parseProduct, parseProducts } from "./catalog.validation";
import type { Catalog, ProductIntent } from "./catalog.types";

export async function writeProduct(
  token: string,
  intent: ProductIntent,
  current: Catalog,
) {
  if (intent.kind === "product-archive") {
    await request(`${productEndpoint}/${intent.baseline.id}`, {
      token,
      method: "DELETE",
      expectedStatus: 204,
    });

    return null;
  }

  if (intent.kind === "product-reorder") {
    const products = parseProducts(
      await request(`${productEndpoint}/reorder`, {
        token,
        method: "POST",
        expectedStatus: 200,
        body: { categoryId: intent.category.id, productIds: intent.ids },
      }),
    );

    if (
      products.length !== intent.ids.length ||
      products.some((product, index) => {
        const baseline = intent.baseline.find((item) => item.id === product.id);

        return (
          baseline === undefined ||
          product.id !== intent.ids[index] ||
          product.categoryId !== intent.category.id ||
          product.sortOrder !== index ||
          !sameProduct(product, { ...baseline, sortOrder: index })
        );
      })
    )
      contractFailure();

    return products;
  }

  const creating = intent.kind === "product-create";
  const product = parseProduct(
    await request(
      creating ? productEndpoint : `${productEndpoint}/${intent.baseline.id}`,
      {
        token,
        method: creating ? "POST" : "PATCH",
        expectedStatus: creating ? 201 : 200,
        body: intent.fields,
      },
    ),
  );
  const fields = intent.fields;
  const knownIds = new Set([
    ...current.categories.map((item) => item.id),
    ...current.modifierGroups.map((item) => item.id),
    ...current.modifierOptions.map((item) => item.id),
    ...current.products.flatMap((item) => [
      item.id,
      ...item.priceChoices.map((choice) => choice.id),
    ]),
  ]);

  if (
    !sameCategoryFields(product, fields) ||
    product.categoryId !== fields.categoryId ||
    product.price !== fields.price ||
    product.portionLabel !== fields.portionLabel ||
    product.isAvailable !== fields.isAvailable ||
    (creating ? knownIds.has(product.id) : product.id !== intent.baseline.id) ||
    product.priceChoices.length !== fields.priceChoices.length
  )
    contractFailure();
  for (const expected of fields.priceChoices) {
    const choice = product.priceChoices.find((item) =>
      expected.id === undefined
        ? item.sortOrder === expected.sortOrder
        : item.id === expected.id,
    );

    if (
      choice === undefined ||
      choice.sortOrder !== expected.sortOrder ||
      choice.portionLabel !== normalizePortion(expected.portionLabel) ||
      choice.price !== expected.price ||
      choice.isAvailable !== expected.isAvailable ||
      (expected.id === undefined &&
        (knownIds.has(choice.id) || choice.id === product.id))
    )
      contractFailure();
  }

  if (
    !creating &&
    product.priceChoices.some((choice) => intent.omittedIds.includes(choice.id))
  )
    contractFailure();

  return product;
}
