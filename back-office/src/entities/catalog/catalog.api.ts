import { contractFailure, request } from "../../shared/api/transport";
import { catalogEndpoint, categoryEndpoint } from "./catalog.constants";
import { mapCatalog, sameCategoryFields } from "./catalog.mapper";
import {
  parseCatalog,
  parseCategories,
  parseCategory,
} from "./catalog.validation";
import type { CategoryIntent } from "./catalog.types";

export async function readCatalog(token: string, signal: AbortSignal) {
  return mapCatalog(
    parseCatalog(
      await request(catalogEndpoint, {
        token,
        signal,
        expectedStatus: 200,
      }),
    ),
  );
}

export async function writeCategory(
  token: string,
  intent: CategoryIntent,
  existingIds: readonly string[],
) {
  if (intent.kind === "archive") {
    await request(`${categoryEndpoint}/${intent.baseline.id}`, {
      token,
      method: "DELETE",
      expectedStatus: 204,
    });

    return null;
  }

  if (intent.kind === "reorder") {
    const categories = parseCategories(
      await request(`${categoryEndpoint}/reorder`, {
        token,
        method: "POST",
        body: { categoryIds: intent.ids },
        expectedStatus: 200,
      }),
    );

    if (
      categories.length !== intent.ids.length ||
      categories.some((category, index) => {
        const baseline = intent.baseline.find(
          (item) => item.id === category.id,
        );

        return (
          category.id !== intent.ids[index] ||
          category.sortOrder !== index ||
          baseline === undefined ||
          !sameCategoryFields(category, { ...baseline, sortOrder: index })
        );
      })
    )
      contractFailure();

    return categories;
  }

  const creating = intent.kind === "create";
  const category = parseCategory(
    await request(
      creating ? categoryEndpoint : `${categoryEndpoint}/${intent.baseline.id}`,
      {
        token,
        method: creating ? "POST" : "PATCH",
        body: intent.fields,
        expectedStatus: creating ? 201 : 200,
      },
    ),
  );

  if (
    !sameCategoryFields(category, intent.fields) ||
    (creating
      ? existingIds.includes(category.id)
      : category.id !== intent.baseline.id)
  )
    contractFailure();

  return category;
}
