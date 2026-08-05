import {
  assertAvailableActivePosition,
  assertCategoryDetails,
  assertCurrentCategory,
  assertFullCategoryReorder,
  CategoryAdminError,
} from './category-admin.policy';
import { maximumCategorySortOrder } from './category-admin.policy.constants';
import type { AdminCategory } from './category-admin.policy.types';

const currentCategory: AdminCategory = {
  id: 'coffee', name: 'Кофе', description: 'Напитки', sortOrder: 0, isActive: true, archivedAt: null,
};

describe('category admin policy', () => {
  it('отклоняет активную категорию с занятой позицией', () => {
    expect(() => assertAvailableActivePosition([currentCategory], null, {
      name: 'Чай', description: 'Напитки', sortOrder: 0, isActive: true,
    })).toThrow(CategoryAdminError);
  });

  it('разрешает неактивной категории занятую позицию', () => {
    expect(() => assertAvailableActivePosition([currentCategory], null, {
      name: 'Чай', description: 'Напитки', sortOrder: 0, isActive: false,
    })).not.toThrow();
  });

  it('различает отсутствующую и архивную категории', () => {
    expect(() => assertCurrentCategory(null)).toThrow('CATEGORY_NOT_FOUND');
    expect(() => assertCurrentCategory({ ...currentCategory, archivedAt: new Date() })).toThrow('CATEGORY_ARCHIVED');
  });

  it('требует полный набор текущих категорий для переупорядочивания', () => {
    expect(() => assertFullCategoryReorder([currentCategory, { ...currentCategory, id: 'tea' }], ['tea'])).toThrow('CATEGORY_REORDER_INVALID');
    expect(() => assertFullCategoryReorder([currentCategory, { ...currentCategory, id: 'tea' }], ['tea', 'coffee'])).not.toThrow();
  });

  it('отклоняет пустое имя и отрицательную позицию', () => {
    expect(() => assertCategoryDetails({ name: ' ', description: '', sortOrder: 0, isActive: true })).toThrow('CATEGORY_INVALID');
    expect(() => assertCategoryDetails({ name: 'Чай', description: '', sortOrder: -1, isActive: true })).toThrow('CATEGORY_INVALID');
    expect(() => assertCategoryDetails({ name: 'Чай', description: '', sortOrder: maximumCategorySortOrder + 1, isActive: true })).toThrow('CATEGORY_INVALID');
  });

  it('разрешает переупорядочивание категории с допустимой максимальной позицией', () => {
    expect(() => assertFullCategoryReorder([
      { ...currentCategory, sortOrder: maximumCategorySortOrder },
    ], ['coffee'])).not.toThrow();
  });
});
