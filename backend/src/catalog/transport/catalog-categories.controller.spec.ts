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
import { ManageCategoriesUseCase } from "../application/manage-categories.use-case";
import { CategoryAdminError } from "../domain/category-admin.policy";
import { catalogCategoriesControllerPath } from "./catalog-categories.controller.constants";
import { CatalogCategoriesController } from "./catalog-categories.controller";
import { ReorderCategoriesDto } from "./catalog-categories.controller.dto";

const swaggerResponsesMetadataKey = "swagger/apiResponse";
const swaggerParametersMetadataKey = "swagger/apiParameters";
const swaggerModelPropertyMetadataKey = "swagger/apiModelProperties";

const category = {
  id: "73444b86-4c6f-459e-871d-0f7995c1af36",
  name: "Кофе",
  description: "Напитки",
  sortOrder: 0,
  isActive: true,
  archivedAt: null,
};
const auth = {
  userId: "actor-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "administrator" as const,
};
const request = { requestId: "request-id" };

describe("CatalogCategoriesController", () => {
  it("создаёт категорию из DTO и передаёт автора с requestId", async () => {
    const manage = { create: jest.fn().mockResolvedValue(category) };
    const controller = new CatalogCategoriesController(
      manage as unknown as ManageCategoriesUseCase,
    );

    await expect(
      controller.create(
        { name: "Кофе", description: "Напитки", sortOrder: 0, isActive: true },
        auth,
        request,
      ),
    ).resolves.toEqual({
      id: category.id,
      name: "Кофе",
      description: "Напитки",
      sortOrder: 0,
      isActive: true,
    });
    expect(manage.create).toHaveBeenCalledWith({
      name: "Кофе",
      description: "Напитки",
      sortOrder: 0,
      isActive: true,
      actorId: "actor-id",
      requestId: "request-id",
    });
  });

  it("сохраняет NOT_FOUND и ARCHIVED для категории", async () => {
    const manage = {
      archive: jest
        .fn()
        .mockRejectedValueOnce(new CategoryAdminError("CATEGORY_NOT_FOUND"))
        .mockRejectedValueOnce(new CategoryAdminError("CATEGORY_ARCHIVED")),
    };
    const controller = new CatalogCategoriesController(
      manage as unknown as ManageCategoriesUseCase,
    );

    await expect(
      controller.archive(category.id, auth, request),
    ).rejects.toMatchObject({
      response: {
        code: "CATEGORY_NOT_FOUND",
        details: null,
        message: "Category not found",
      },
      status: 404,
    });
    await expect(
      controller.archive(category.id, auth, request),
    ).rejects.toMatchObject({
      response: {
        code: "CATEGORY_ARCHIVED",
        details: null,
        message: "Category is archived",
      },
      status: 409,
    });
  });

  it("возвращает ошибку поля sortOrder для недопустимого значения", async () => {
    const manage = { create: jest.fn() };
    const controller = new CatalogCategoriesController(
      manage as unknown as ManageCategoriesUseCase,
    );

    await expect(
      controller.create(
        {
          name: "Кофе",
          description: "Напитки",
          sortOrder: 2_147_483_648,
          isActive: true,
        },
        auth,
        request,
      ),
    ).rejects.toMatchObject({
      response: {
        code: "VALIDATION_ERROR",
        details: {
          fields: [
            { path: "sortOrder", reason: "Must be a non-negative int32" },
          ],
        },
        message: "Invalid catalog command",
      },
      status: 400,
    });
    expect(manage.create).not.toHaveBeenCalled();
  });

  it("регистрирует изменяющие endpoints только для Administrator", () => {
    const prototype = CatalogCategoriesController.prototype;

    expect(
      Reflect.getMetadata(PATH_METADATA, CatalogCategoriesController),
    ).toBe(catalogCategoriesControllerPath);
    expect(Reflect.getMetadata(PATH_METADATA, prototype.create)).toBe("/");
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.create)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, prototype.reorder)).toBe(
      200,
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CatalogCategoriesController),
    ).toEqual([SessionGuard, RolesGuard]);
    expect(
      Reflect.getMetadata(rolesMetadataKey, CatalogCategoriesController),
    ).toBe("Administrator");
    expect(responseStatuses(CatalogCategoriesController)).toEqual([
      "401",
      "403",
      "500",
    ]);
    expect(responseStatuses(prototype.create)).toEqual(["201", "400", "409"]);
    expect(responseStatuses(prototype.update)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.reorder)).toEqual(["200", "400", "409"]);
    expect(responseStatuses(prototype.archive)).toEqual([
      "204",
      "400",
      "404",
      "409",
    ]);
    expect(Reflect.getMetadata(swaggerParametersMetadataKey, prototype.update)).toContainEqual({
      name: "categoryId",
      in: "path",
      required: true,
      format: "uuid",
    });
    expect(Reflect.getMetadata(swaggerModelPropertyMetadataKey, ReorderCategoriesDto.prototype, "categoryIds")).toMatchObject({
      type: "string",
      format: "uuid",
      isArray: true,
    });
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(Reflect.getMetadata(swaggerResponsesMetadataKey, target)).sort();
}
