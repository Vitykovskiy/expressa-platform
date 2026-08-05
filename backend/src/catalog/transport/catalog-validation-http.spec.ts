import { CatalogCategoriesController } from "./catalog-categories.controller";
import { CatalogCategoryModifiersController } from "./catalog-category-modifiers.controller";
import { CatalogModifiersController } from "./catalog-modifiers.controller";
import { CatalogProductsController } from "./catalog-products.controller";
import { UnifiedExceptionFilter } from "../../platform/observability/unified-exception.filter";
import type { ManageCategoriesUseCase } from "../application/manage-categories.use-case";
import type { ManageCategoryModifiersUseCase } from "../application/manage-category-modifiers.use-case";
import type { ManageModifiersUseCase } from "../application/manage-modifiers.use-case";
import type { ManageProductsUseCase } from "../application/manage-products.use-case";
import { ProductAdminError } from "../domain/product-admin.policy";

const auth = {
  userId: "actor-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "administrator" as const,
};
const request = { requestId: "catalog-request-id" };
const categoryId = "73444b86-4c6f-459e-871d-0f7995c1af36";
const groupId = "a3444b86-4c6f-459e-871d-0f7995c1af36";

describe("catalog validation HTTP responses", () => {
  it.each([
    [
      "category",
      () =>
        new CatalogCategoriesController({
          create: jest.fn(),
        } as unknown as ManageCategoriesUseCase).create(
          { name: "Кофе", description: "", sortOrder: -1, isActive: true },
          auth,
          request,
        ),
      "sortOrder",
    ],
    [
      "product",
      () =>
        new CatalogProductsController({
          update: jest.fn().mockRejectedValue(
            new ProductAdminError("PRODUCT_INVALID", [
              {
                path: "type",
                reason: "Product type cannot be changed",
              },
            ]),
          ),
        } as unknown as ManageProductsUseCase).update(
          categoryId,
          {
            categoryId,
            type: "OTHER",
            name: "Печенье",
            description: "",
            priceMinor: 100,
            sortOrder: 0,
            isActive: true,
            isAvailable: true,
            variants: [],
          },
          auth,
          request,
        ),
      "type",
    ],
    [
      "modifier",
      () =>
        new CatalogModifiersController({
          createGroup: jest.fn(),
        } as unknown as ManageModifiersUseCase).createGroup(
          {
            name: "Молоко",
            selectionType: "multiple",
            minSelect: -1,
            maxSelect: 1,
            isActive: true,
            options: [],
          },
          auth,
          request,
        ),
      "minSelect",
    ],
    [
      "category modifiers",
      () =>
        new CatalogCategoryModifiersController({
          replace: jest.fn(),
        } as unknown as ManageCategoryModifiersUseCase).replace(
          categoryId,
          { groupIds: [groupId, groupId] },
          auth,
          request,
        ),
      "groupIds",
    ],
  ])(
    "%s includes fields and requestId after exception filter",
    async (_aggregate, command, path) => {
      const reply = jest.fn();
      const filter = new UnifiedExceptionFilter(
        {
          httpAdapter: {
            getRequestUrl: () => "/api/v1/backoffice/catalog",
            reply,
          },
        } as never,
        { log: jest.fn() } as never,
        { recordApiError: jest.fn() } as never,
      );

      await expect(command()).rejects.toBeDefined();
      try {
        await command();
      } catch (error) {
        filter.catch(error, {
          switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => ({}),
          }),
        } as never);
      }

      expect(reply).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          code: "VALIDATION_ERROR",
          details: { fields: [expect.objectContaining({ path })] },
          requestId: "catalog-request-id",
        }),
        400,
      );
    },
  );
});
