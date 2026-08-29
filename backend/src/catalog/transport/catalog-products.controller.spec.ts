import { RequestMethod } from "@nestjs/common";
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { rolesMetadataKey } from "../../auth/transport/roles.decorator.constants";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { ManageProductsUseCase } from "../application/manage-products.use-case";
import { ProductAdminError } from "../domain/product-admin.policy";
import { catalogProductsControllerPath } from "./catalog-products.controller.constants";
import { CatalogProductsController } from "./catalog-products.controller";
import { ReorderProductsDto } from "./catalog-products.controller.dto";

const swaggerResponsesMetadataKey = "swagger/apiResponse";
const swaggerParametersMetadataKey = "swagger/apiParameters";
const swaggerModelPropertyMetadataKey = "swagger/apiModelProperties";
const product = {
  id: "73444b86-4c6f-459e-871d-0f7995c1af36",
  categoryId: "73444b86-4c6f-459e-871d-0f7995c1af35",
  type: "OTHER" as const,
  name: "Печенье",
  description: "",
  price: 100,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  archivedAt: null,
  variants: [],
};
const auth = {
  userId: "actor-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "administrator" as const,
};
const request = { requestId: "request-id" };
describe("CatalogProductsController", () => {
  it("передаёт автора и requestId при создании", async () => {
    const manage = { create: jest.fn().mockResolvedValue(product) };
    const controller = new CatalogProductsController(
      manage as unknown as ManageProductsUseCase,
    );
    await expect(
      controller.create({ ...product, variants: [] }, auth, request),
    ).resolves.toEqual({ ...product, variants: [], archivedAt: undefined });
    expect(manage.create).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "actor-id", requestId: "request-id" }),
    );
  });
  it("проверяет DTO и преобразует доменную ошибку", async () => {
    const manage = {
      create: jest.fn(),
      archive: jest
        .fn()
        .mockRejectedValueOnce(new ProductAdminError("PRODUCT_NOT_FOUND"))
        .mockRejectedValueOnce(new ProductAdminError("PRODUCT_ARCHIVED")),
    };
    const controller = new CatalogProductsController(
      manage as unknown as ManageProductsUseCase,
    );
    await expect(
      controller.create(
        { ...product, sortOrder: 2_147_483_648, variants: [] },
        auth,
        request,
      ),
    ).rejects.toMatchObject({
      status: 400,
      response: {
        code: "VALIDATION_ERROR",
        details: {
          fields: [
            {
              path: "sortOrder",
              reason: "Must be a non-negative int32",
            },
          ],
        },
        message: "Invalid catalog command",
      },
    });
    await expect(
      controller.archive(product.id, auth, request),
    ).rejects.toMatchObject({
      status: 404,
      response: expect.objectContaining({ code: "PRODUCT_NOT_FOUND" }),
    });
    await expect(
      controller.archive(product.id, auth, request),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ code: "PRODUCT_ARCHIVED" }),
    });
    expect(manage.create).not.toHaveBeenCalled();
  });
  it("передаёт update и reorder с DTO", async () => {
    const manage = {
      update: jest.fn().mockResolvedValue(product),
      reorder: jest.fn().mockResolvedValue([product]),
    };
    const controller = new CatalogProductsController(
      manage as unknown as ManageProductsUseCase,
    );
    await expect(
      controller.update(
        product.id,
        { ...product, variants: [] },
        auth,
        request,
      ),
    ).resolves.toMatchObject({ id: product.id });
    await expect(
      controller.reorder(
        { categoryId: product.categoryId, productIds: [product.id] },
        auth,
        request,
      ),
    ).resolves.toHaveLength(1);
    expect(manage.update).toHaveBeenCalledWith(
      expect.objectContaining({ productId: product.id }),
    );
    expect(manage.reorder).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: product.categoryId }),
    );
  });
  it("регистрирует изменяющие endpoints только для Administrator", () => {
    const prototype = CatalogProductsController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, CatalogProductsController)).toBe(
      catalogProductsControllerPath,
    );
    expect(Reflect.getMetadata(PATH_METADATA, prototype.create)).toBe("/");
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.create)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, prototype.reorder)).toBe(
      200,
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CatalogProductsController),
    ).toEqual([SessionGuard, RolesGuard]);
    expect(
      Reflect.getMetadata(rolesMetadataKey, CatalogProductsController),
    ).toBe("Administrator");
    expect(responseStatuses(CatalogProductsController)).toEqual([
      "401",
      "403",
      "500",
    ]);
    expect(responseStatuses(prototype.create)).toEqual([
      "201",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.update)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.reorder)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.archive)).toEqual([
      "204",
      "400",
      "404",
      "409",
    ]);
    expect(Reflect.getMetadata(swaggerParametersMetadataKey, prototype.update)).toContainEqual({
      name: "productId",
      in: "path",
      required: true,
      format: "uuid",
    });
    expect(Reflect.getMetadata(swaggerModelPropertyMetadataKey, ReorderProductsDto.prototype, "productIds")).toMatchObject({
      type: "string",
      format: "uuid",
      isArray: true,
    });
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(Reflect.getMetadata(swaggerResponsesMetadataKey, target)).sort();
}
