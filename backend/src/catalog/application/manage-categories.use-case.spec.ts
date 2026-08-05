import { CategoryAdminError } from '../domain/category-admin.policy';
import { maximumCategorySortOrder } from '../domain/category-admin.policy.constants';
import type { AdminCategory } from '../domain/category-admin.policy.types';
import { ManageCategoriesUseCase } from './manage-categories.use-case';
import type { CategoriesRepository, CategoriesUnitOfWork } from './categories.repository.types';

const category: AdminCategory = {
  id: 'coffee', name: 'Кофе', description: 'Напитки', sortOrder: 0, isActive: true, archivedAt: null,
};

function setup() {
  const repository: jest.Mocked<CategoriesRepository> = {
    findById: jest.fn(), findCurrent: jest.fn(), create: jest.fn(), update: jest.fn(), reorder: jest.fn(), archive: jest.fn(), writeAudit: jest.fn(),
  };
  const run = jest.fn(async <Result>(command: (value: CategoriesRepository) => Promise<Result>, audit: (value: CategoriesRepository, result: Result) => Promise<void>): Promise<Result> => {
      const result = await command(repository);
      await audit(repository, result);
      return result;
  });
  const unitOfWork: CategoriesUnitOfWork = {
    run: run as CategoriesUnitOfWork['run'],
  };
  return { repository, run, useCase: new ManageCategoriesUseCase(unitOfWork) };
}

describe('ManageCategoriesUseCase', () => {
  it('создаёт категорию и аудит в одной команде', async () => {
    const { repository, useCase } = setup();
    repository.findCurrent.mockResolvedValue([]);
    repository.create.mockResolvedValue(category);
    repository.writeAudit.mockResolvedValue(undefined);

    await expect(useCase.create({
      name: category.name, description: category.description, sortOrder: category.sortOrder, isActive: category.isActive,
      actorId: 'actor', requestId: 'request',
    })).resolves.toEqual(category);

    expect(repository.writeAudit).toHaveBeenCalledWith({
      actorId: 'actor', requestId: 'request', action: 'CATEGORY_CREATED', categoryId: 'coffee', before: null, after: category,
    });
  });

  it('обновляет категорию и сохраняет точные before/after', async () => {
    const { repository, useCase } = setup();
    const updated = { ...category, name: 'Чай', sortOrder: 1 };
    repository.findById.mockResolvedValue(category);
    repository.findCurrent.mockResolvedValue([category]);
    repository.update.mockResolvedValue(updated);
    repository.writeAudit.mockResolvedValue(undefined);

    await expect(useCase.update({ ...updated, categoryId: category.id, actorId: 'actor', requestId: 'request' })).resolves.toEqual(updated);
    expect(repository.writeAudit).toHaveBeenCalledWith({
      actorId: 'actor', requestId: 'request', action: 'CATEGORY_UPDATED', categoryId: 'coffee', before: category, after: updated,
    });
  });

  it('архивирует категорию и сохраняет точные before/after', async () => {
    const { repository, useCase } = setup();
    const archived = { ...category, archivedAt: new Date('2026-08-04T00:00:00.000Z') };
    repository.findById.mockResolvedValue(category);
    repository.archive.mockResolvedValue(archived);
    repository.writeAudit.mockResolvedValue(undefined);

    await expect(useCase.archive({ categoryId: category.id, actorId: 'actor', requestId: 'request' })).resolves.toBeUndefined();
    expect(repository.writeAudit).toHaveBeenCalledWith({
      actorId: 'actor', requestId: 'request', action: 'CATEGORY_ARCHIVED', categoryId: 'coffee', before: category, after: archived,
    });
  });

  it('отклоняет изменение архивной категории до записи', async () => {
    const { repository, useCase } = setup();
    repository.findById.mockResolvedValue({ ...category, archivedAt: new Date() });

    await expect(useCase.update({ ...category, categoryId: category.id, actorId: 'actor', requestId: 'request' })).rejects.toThrow(CategoryAdminError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('требует полный набор и аудирует каждую категорию после переупорядочивания', async () => {
    const { repository, useCase } = setup();
    const tea = { ...category, id: 'tea', name: 'Чай', sortOrder: 1 };
    const reordered = [{ ...tea, sortOrder: 0 }, { ...category, sortOrder: 1 }];
    repository.findCurrent.mockResolvedValue([category, tea]);
    repository.reorder.mockResolvedValue(reordered);
    repository.writeAudit.mockResolvedValue(undefined);

    await expect(useCase.reorder({ actorId: 'actor', requestId: 'request', categoryIds: ['coffee'] })).rejects.toThrow('CATEGORY_REORDER_INVALID');
    expect(repository.reorder).not.toHaveBeenCalled();

    await expect(useCase.reorder({ actorId: 'actor', requestId: 'request', categoryIds: ['tea', 'coffee'] })).resolves.toEqual(reordered);
    expect(repository.writeAudit).toHaveBeenNthCalledWith(1, {
      actorId: 'actor', requestId: 'request', action: 'CATEGORY_REORDERED', categoryId: 'tea', before: tea, after: reordered[0],
    });
    expect(repository.writeAudit).toHaveBeenNthCalledWith(2, {
      actorId: 'actor', requestId: 'request', action: 'CATEGORY_REORDERED', categoryId: 'coffee', before: category, after: reordered[1],
    });
  });

  it('отклоняет выход sortOrder за int32 до запуска команды', async () => {
    const { run, useCase } = setup();

    await expect(useCase.create({
      name: category.name, description: category.description, sortOrder: maximumCategorySortOrder + 1, isActive: true,
      actorId: 'actor', requestId: 'request',
    })).rejects.toThrow('CATEGORY_INVALID');
    expect(run).not.toHaveBeenCalled();
  });
});
