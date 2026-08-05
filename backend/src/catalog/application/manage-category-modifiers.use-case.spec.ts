import { CategoryAdminError } from "../domain/category-admin.policy";
import {
  CategoryModifierGroupsError,
  ManageCategoryModifiersUseCase,
} from "./manage-category-modifiers.use-case";
import type {
  CategoryModifiersRepository,
  CategoryModifiersUnitOfWork,
} from "./category-modifiers.repository.types";

const categoryId = "73444b86-4c6f-459e-871d-0f7995c1af36";
const firstGroupId = "a3444b86-4c6f-459e-871d-0f7995c1af36";
const secondGroupId = "b3444b86-4c6f-459e-871d-0f7995c1af36";
const groupIds = [firstGroupId, secondGroupId];

function setup() {
  const repository: jest.Mocked<CategoryModifiersRepository> = {
    categoryExists: jest.fn(),
    findCurrentModifierGroupIds: jest.fn(),
    findByCategoryId: jest.fn(),
    replace: jest.fn(),
    writeAudit: jest.fn(),
  };
  const run = jest.fn(
    async <Result>(
      command: (value: CategoryModifiersRepository) => Promise<Result>,
      audit: (
        value: CategoryModifiersRepository,
        result: Result,
      ) => Promise<void>,
    ): Promise<Result> => {
      const result = await command(repository);
      await audit(repository, result);
      return result;
    },
  );
  const unitOfWork: CategoryModifiersUnitOfWork = {
    run: run as CategoryModifiersUnitOfWork["run"],
  };
  return {
    repository,
    run,
    useCase: new ManageCategoryModifiersUseCase(unitOfWork),
  };
}

describe("ManageCategoryModifiersUseCase", () => {
  it("заменяет упорядоченные связи и сохраняет точные before/after в аудите", async () => {
    const { repository, useCase } = setup();
    const before = [{ categoryId, groupId: secondGroupId, sortOrder: 0 }];
    const after = groupIds.map((groupId, sortOrder) => ({
      categoryId,
      groupId,
      sortOrder,
    }));
    repository.categoryExists.mockResolvedValue(true);
    repository.findCurrentModifierGroupIds.mockResolvedValue(groupIds);
    repository.findByCategoryId.mockResolvedValue(before);
    repository.replace.mockResolvedValue(after);
    repository.writeAudit.mockResolvedValue(undefined);

    await expect(
      useCase.replace({
        categoryId,
        groupIds,
        actorId: "actor-id",
        requestId: "request-id",
      }),
    ).resolves.toEqual(after);

    expect(repository.replace).toHaveBeenCalledWith(categoryId, groupIds);
    expect(repository.writeAudit).toHaveBeenCalledWith({
      actorId: "actor-id",
      requestId: "request-id",
      categoryId,
      before,
      after,
    });
  });

  it("отклоняет отсутствующую или архивную категорию до изменения", async () => {
    const { repository, useCase } = setup();
    repository.categoryExists.mockResolvedValue(false);

    await expect(
      useCase.replace({
        categoryId,
        groupIds,
        actorId: "actor-id",
        requestId: "request-id",
      }),
    ).rejects.toEqual(new CategoryAdminError("CATEGORY_NOT_FOUND"));
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it("отклоняет отсутствующие или архивные группы до изменения", async () => {
    const { repository, useCase } = setup();
    repository.categoryExists.mockResolvedValue(true);
    repository.findCurrentModifierGroupIds.mockResolvedValue([firstGroupId]);

    await expect(
      useCase.replace({
        categoryId,
        groupIds,
        actorId: "actor-id",
        requestId: "request-id",
      }),
    ).rejects.toEqual(
      new CategoryModifierGroupsError("CATEGORY_MODIFIER_GROUPS_INVALID", [
        { path: "groupIds", reason: "Must reference current modifier groups" },
      ]),
    );
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it("отклоняет повторяющиеся группы до запуска единицы работы", async () => {
    const { run, useCase } = setup();

    await expect(
      useCase.replace({
        categoryId,
        groupIds: [firstGroupId, firstGroupId],
        actorId: "actor-id",
        requestId: "request-id",
      }),
    ).rejects.toEqual(
      new CategoryModifierGroupsError("CATEGORY_MODIFIER_GROUPS_INVALID", [
        { path: "groupIds", reason: "Must not contain duplicates" },
      ]),
    );
    expect(run).not.toHaveBeenCalled();
  });
});
