import { contractFailure, isRecord, request } from "../../shared/api/transport";
import { categoryEndpoint, catalogUuidPattern } from "./catalog.constants";
import type { AssociationIntent, CatalogLinkDto } from "./catalog.types";

export async function writeCategoryAssociations(
  token: string,
  intent: AssociationIntent,
): Promise<CatalogLinkDto[]> {
  const value = await request(
    `${categoryEndpoint}/${intent.baseline.category.id}/modifier-groups`,
    {
      method: "PUT",
      token,
      body: { groupIds: [...intent.ids] },
      expectedStatus: 200,
    },
  );

  if (!Array.isArray(value) || value.length !== intent.ids.length)
    contractFailure();

  return value.map((item: unknown, index) => {
    if (
      !isRecord(item) ||
      typeof item.categoryId !== "string" ||
      !catalogUuidPattern.test(item.categoryId) ||
      typeof item.groupId !== "string" ||
      !catalogUuidPattern.test(item.groupId) ||
      item.categoryId !== intent.baseline.category.id ||
      item.groupId !== intent.ids[index] ||
      item.sortOrder !== index
    )
      contractFailure();

    return {
      categoryId: item.categoryId,
      groupId: item.groupId,
      sortOrder: index,
    };
  });
}
