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
import { ManageModifiersUseCase } from "../application/manage-modifiers.use-case";
import { ModifierAdminError } from "../domain/modifier-admin.policy";
import { catalogModifiersControllerPath } from "./catalog-modifiers.controller.constants";
import { CatalogModifiersController } from "./catalog-modifiers.controller";
import { ReorderModifierOptionsDto } from "./catalog-modifiers.controller.dto";

const swaggerResponsesMetadataKey = "swagger/apiResponse";
const swaggerParametersMetadataKey = "swagger/apiParameters";
const swaggerModelPropertyMetadataKey = "swagger/apiModelProperties";
const group = {
  id: "73444b86-4c6f-459e-871d-0f7995c1af36",
  name: "Молоко",
  selectionType: "multiple" as const,
  minSelect: 0,
  maxSelect: 2,
  isActive: true,
  archivedAt: null,
  options: [],
};
const auth = {
  userId: "actor-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "administrator" as const,
};
const request = { requestId: "request-id" };
describe("CatalogModifiersController", () => {
  it("передаёт автора для создания группы", async () => {
    const manage = { createGroup: jest.fn().mockResolvedValue(group) };
    const controller = new CatalogModifiersController(
      manage as unknown as ManageModifiersUseCase,
    );
    await expect(
      controller.createGroup(group, auth, request),
    ).resolves.toMatchObject({ id: group.id });
    expect(manage.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "actor-id", requestId: "request-id" }),
    );
  });
  it("отклоняет невалидный транспорт и отображает предметные ошибки", async () => {
    const manage = {
      createGroup: jest
        .fn()
        .mockRejectedValueOnce(
          new ModifierAdminError("MODIFIER_GROUP_NOT_FOUND"),
        )
        .mockRejectedValueOnce(
          new ModifierAdminError("MODIFIER_GROUP_ARCHIVED"),
        ),
      createOption: jest.fn(),
    };
    const controller = new CatalogModifiersController(
      manage as unknown as ManageModifiersUseCase,
    );
    await expect(
      controller.createGroup({ ...group, minSelect: -1 }, auth, request),
    ).rejects.toMatchObject({
      status: 400,
      response: {
        code: "VALIDATION_ERROR",
        details: {
          fields: [
            {
              path: "minSelect",
              reason: "Must be a non-negative int32",
            },
          ],
        },
        message: "Invalid catalog command",
      },
    });
    await expect(
      controller.createGroup(group, auth, request),
    ).rejects.toMatchObject({
      status: 404,
      response: expect.objectContaining({ code: "MODIFIER_GROUP_NOT_FOUND" }),
    });
    await expect(
      controller.createGroup(group, auth, request),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ code: "MODIFIER_GROUP_ARCHIVED" }),
    });
    await expect(
      controller.createOption(
        group.id,
        {
          name: "Овсяное",
          priceDelta: 2_147_483_648,
          sortOrder: 0,
          isDefault: true,
          isAvailable: true,
        },
        auth,
        request,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(manage.createOption).not.toHaveBeenCalled();
  });
  it("защищает endpoints ролью Administrator", () => {
    const prototype = CatalogModifiersController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, CatalogModifiersController)).toBe(
      catalogModifiersControllerPath,
    );
    expect(Reflect.getMetadata(PATH_METADATA, prototype.createGroup)).toBe("/");
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.createGroup)).toBe(
      RequestMethod.POST,
    );
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, prototype.reorderOptions),
    ).toBe(200);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CatalogModifiersController),
    ).toEqual([SessionGuard, RolesGuard]);
    expect(
      Reflect.getMetadata(rolesMetadataKey, CatalogModifiersController),
    ).toBe("Administrator");
    expect(responseStatuses(CatalogModifiersController)).toEqual([
      "401",
      "403",
      "500",
    ]);
    expect(responseStatuses(prototype.createGroup)).toEqual(["201", "400"]);
    expect(responseStatuses(prototype.updateGroup)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.archiveGroup)).toEqual([
      "204",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.createOption)).toEqual([
      "201",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.updateOption)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.reorderOptions)).toEqual([
      "200",
      "400",
      "404",
      "409",
    ]);
    expect(responseStatuses(prototype.archiveOption)).toEqual([
      "204",
      "400",
      "404",
      "409",
    ]);
    for (const method of [
      prototype.updateGroup,
      prototype.archiveGroup,
      prototype.createOption,
      prototype.reorderOptions,
    ]) {
      expect(Reflect.getMetadata(swaggerParametersMetadataKey, method)).toContainEqual({
        name: "groupId",
        in: "path",
        required: true,
        format: "uuid",
      });
    }
    for (const method of [prototype.updateOption, prototype.archiveOption]) {
      expect(Reflect.getMetadata(swaggerParametersMetadataKey, method)).toContainEqual({
        name: "optionId",
        in: "path",
        required: true,
        format: "uuid",
      });
    }
    expect(Reflect.getMetadata(swaggerModelPropertyMetadataKey, ReorderModifierOptionsDto.prototype, "optionIds")).toMatchObject({
      type: "string",
      format: "uuid",
      isArray: true,
    });
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(Reflect.getMetadata(swaggerResponsesMetadataKey, target)).sort();
}
