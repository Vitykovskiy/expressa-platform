import type { CatalogSeed } from './seed.types';

const coffeeCategoryId = '00000000-0000-4000-8000-000000000001';
const bakeryCategoryId = '00000000-0000-4000-8000-000000000002';
const cappuccinoId = '00000000-0000-4000-8000-000000000010';
const espressoId = '00000000-0000-4000-8000-000000000020';
const croissantId = '00000000-0000-4000-8000-000000000030';
const unavailableDessertId = '00000000-0000-4000-8000-000000000040';
const unpublishedDrinkId = '00000000-0000-4000-8000-000000000050';
const milkGroupId = '00000000-0000-4000-8000-000000000100';

export const catalogSeed: CatalogSeed = {
  categories: [
    {
      id: coffeeCategoryId,
      name: 'Кофе',
      description: 'Кофейные напитки.',
      sortOrder: 10,
      isActive: true,
    },
    {
      id: bakeryCategoryId,
      name: 'Выпечка',
      description: 'Свежая выпечка.',
      sortOrder: 20,
      isActive: true,
    },
  ],
  products: [
    {
      id: cappuccinoId,
      categoryId: coffeeCategoryId,
      type: 'DRINK',
      name: 'Капучино',
      description: 'Эспрессо с молочной пеной.',
      priceMinor: null,
      sortOrder: 10,
      isActive: true,
      isAvailable: true,
    },
    {
      id: espressoId,
      categoryId: coffeeCategoryId,
      type: 'DRINK',
      name: 'Эспрессо',
      description: 'Классический двойной эспрессо.',
      priceMinor: null,
      sortOrder: 20,
      isActive: true,
      isAvailable: true,
    },
    {
      id: croissantId,
      categoryId: bakeryCategoryId,
      type: 'OTHER',
      name: 'Круассан',
      description: 'Слоёный круассан из масляного теста.',
      priceMinor: 22_000,
      sortOrder: 10,
      isActive: true,
      isAvailable: true,
    },
    {
      id: unavailableDessertId,
      categoryId: bakeryCategoryId,
      type: 'OTHER',
      name: 'Чизкейк',
      description: 'Десерт временно недоступен.',
      priceMinor: 28_000,
      sortOrder: 20,
      isActive: true,
      isAvailable: false,
    },
    {
      id: unpublishedDrinkId,
      categoryId: coffeeCategoryId,
      type: 'DRINK',
      name: 'Тестовый напиток',
      description: 'Непубликуемый кандидат без размеров.',
      priceMinor: null,
      sortOrder: 30,
      isActive: false,
      isAvailable: true,
    },
  ],
  productVariants: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      productId: cappuccinoId,
      size: 'S',
      priceMinor: 28_000,
      sortOrder: 10,
      isAvailable: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000012',
      productId: cappuccinoId,
      size: 'M',
      priceMinor: 32_000,
      sortOrder: 20,
      isAvailable: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000013',
      productId: cappuccinoId,
      size: 'L',
      priceMinor: 36_000,
      sortOrder: 30,
      isAvailable: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000021',
      productId: espressoId,
      size: 'S',
      priceMinor: 20_000,
      sortOrder: 10,
      isAvailable: true,
    },
  ],
  modifierGroups: [
    {
      id: milkGroupId,
      name: 'Молоко',
      selectionType: 'single',
      minSelect: 1,
      maxSelect: 1,
      isActive: true,
    },
  ],
  modifierOptions: [
    {
      id: '00000000-0000-4000-8000-000000000101',
      groupId: milkGroupId,
      name: 'Обычное молоко',
      priceDeltaMinor: 0,
      sortOrder: 10,
      isDefault: true,
      isAvailable: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      groupId: milkGroupId,
      name: 'Овсяное молоко',
      priceDeltaMinor: 8_000,
      sortOrder: 20,
      isDefault: false,
      isAvailable: true,
    },
  ],
  categoryModifierGroups: [
    {
      categoryId: coffeeCategoryId,
      groupId: milkGroupId,
      sortOrder: 10,
    },
  ],
};

export const categoryUpsertSql = `
  INSERT INTO categories (id, name, description, sort_order, is_active, archived_at)
  VALUES ($1, $2, $3, $4, $5, NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    archived_at = NULL
`;

export const productUpsertSql = `
  INSERT INTO products (
    id, category_id, type, name, description, price_minor, sort_order, is_active, is_available, archived_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_minor = EXCLUDED.price_minor,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const productVariantUpsertSql = `
  INSERT INTO product_variants (id, product_id, size, price_minor, sort_order, is_available, archived_at)
  VALUES ($1, $2, $3, $4, $5, $6, NULL)
  ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    size = EXCLUDED.size,
    price_minor = EXCLUDED.price_minor,
    sort_order = EXCLUDED.sort_order,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const modifierGroupUpsertSql = `
  INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select, is_active, archived_at)
  VALUES ($1, $2, $3, $4, $5, $6, NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    selection_type = EXCLUDED.selection_type,
    min_select = EXCLUDED.min_select,
    max_select = EXCLUDED.max_select,
    is_active = EXCLUDED.is_active,
    archived_at = NULL
`;

export const modifierOptionUpsertSql = `
  INSERT INTO modifier_options (
    id, group_id, name, price_delta_minor, sort_order, is_default, is_available, archived_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
  ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_delta_minor = EXCLUDED.price_delta_minor,
    sort_order = EXCLUDED.sort_order,
    is_default = EXCLUDED.is_default,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const categoryModifierGroupUpsertSql = `
  INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
  VALUES ($1, $2, $3)
  ON CONFLICT (category_id, group_id) DO UPDATE SET
    sort_order = EXCLUDED.sort_order
`;
