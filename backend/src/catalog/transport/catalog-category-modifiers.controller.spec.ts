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
import {
  CategoryModifierGroupsError,
  ManageCategoryModifiersUseCase,
} from "../application/manage-category-modifiers.use-case";
import { CategoryAdminError } from "../domain/category-admin.policy";
import { catalogCategoryModifiersControllerPath } from "./catalog-category-modifiers.controller.constants";
import { CatalogCategoryModifiersController } from "./catalog-category-modifiers.controller";
import { ReplaceCategoryModifierGroupsDto } from "./catalog-category-modifiers.controller.dto";

const swaggerResponsesMetadataKey = "swagger/apiResponse";
const swaggerParametersMetadataKey = "swagger/apiParameters";
const swaggerModelPropertyMetadataKey = "swagger/apiModelProperties";

const categoryId = "73444b86-4c6f-459e-871d-0f7995c1af36";
const groupId = "a3444b86-4c6f-459e-871d-0f7995c1af36";
const groupIds = [groupId];
const auth = {
  userId: "actor-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "administrator" as const,
};
const request = { requestId: "request-id" };

describe("CatalogCategoryModifiersController", () => {
  it("заменяет связи из DTO и передаёт автора с requestId", async () => {
    const assignments = [{ categoryId, groupId, sortOrder: 0 }];
    const manage = { replace: jest.fn().mockResolvedValue(assignments) };
    const controller = new CatalogCategoryModifiersController(
      manage as unknown as ManageCategoryModifiersUseCase,
    );

    await expect(
      controller.replace(categoryId, { groupIds }, auth, request),
    ).resolves.toEqual(assignments);
    expect(manage.replace).toHaveBeenCalledWith({
      categoryId,
      groupIds,
      actorId: "actor-id",
      requestId: "request-id",
    });
  });

  it("возвращает ошибку поля groupIds для отсутствующей группы", async () => {
    const manage = {
      replace: jest.fn().mockRejectedValue(
        new CategoryModifierGroupsError("CATEGORY_MODIFIER_GROUPS_INVALID", [
          {
            path: "groupIds",
            reason: "Must reference current modifier groups",
          },
        ]),
      ),
    };
    const controller = new CatalogCategoryModifiersController(
      manage as unknown as ManageCategoryModifiersUseCase,
    );

    await expect(
      controller.replace(categoryId, { groupIds }, auth, request),
    ).rejects.toMatchObject({
      response: {
        code: "VALIDATION_ERROR",
        details: {
          fields: [
            {
              path: "groupIds",
              reason: "Must reference current modifier groups",
            },
          ],
        },
        message: "Invalid catalog command",
      },
      status: 400,
    });
  });

  it("отклоняет повторяющиеся идентификаторы групп до сценария", async () => {
    const manage = { replace: jest.fn() };
    const controller = new CatalogCategoryModifiersController(
      manage as unknown as ManageCategoryModifiersUseCase,
    );

    await expect(
      controller.replace(
        categoryId,
        { groupIds: [groupId, groupId] },
        auth,
        request,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(manage.replace).not.toHaveBeenCalled();
  });

  it("сохраняет NOT_FOUND категории", async () => {
    const manage = {
      replace: jest
        .fn()
        .mockRejectedValue(new CategoryAdminError("CATEGORY_NOT_FOUND")),
    };
    const controller = new CatalogCategoryModifiersController(
      manage as unknown as ManageCategoryModifiersUseCase,
    );

    await expect(
      controller.replace(categoryId, { groupIds }, auth, request),
    ).rejects.toMatchObject({
      response: {
        code: "CATEGORY_NOT_FOUND",
        details: null,
        message: "Category not found",
      },
      status: 404,
    });
  });

  it("регистрирует endpoint только для Administrator", () => {
    const prototype = CatalogCategoryModifiersController.prototype;

    expect(
      Reflect.getMetadata(PATH_METADATA, CatalogCategoryModifiersController),
    ).toBe(catalogCategoryModifiersControllerPath);
    expect(Reflect.getMetadata(PATH_METADATA, prototype.replace)).toBe(
      ":categoryId/modifier-groups",
    );
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.replace)).toBe(
      RequestMethod.PUT,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, prototype.replace)).toBe(
      200,
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CatalogCategoryModifiersController),
    ).toEqual([SessionGuard, RolesGuard]);
    expect(
      Reflect.getMetadata(rolesMetadataKey, CatalogCategoryModifiersController),
    ).toBe("Administrator");
    expect(responseStatuses(CatalogCategoryModifiersController)).toEqual([
      "401",
      "403",
      "500",
    ]);
    expect(responseStatuses(prototype.replace)).toEqual([
      "200",
      "400",
      "404",
    ]);
    expect(Reflect.getMetadata(swaggerParametersMetadataKey, prototype.replace)).toContainEqual({
      name: "categoryId",
      in: "path",
      required: true,
      format: "uuid",
    });
    expect(Reflect.getMetadata(swaggerModelPropertyMetadataKey, ReplaceCategoryModifierGroupsDto.prototype, "groupIds")).toMatchObject({
      type: "string",
      format: "uuid",
      isArray: true,
      uniqueItems: true,
    });
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(Reflect.getMetadata(swaggerResponsesMetadataKey, target)).sort();
}
