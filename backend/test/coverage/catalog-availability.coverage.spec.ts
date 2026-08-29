import type { Pool } from 'pg';
import { GetPublicMenuUseCase } from '../../src/catalog/application/get-public-menu.use-case';
import { AvailabilityNotFoundError } from '../../src/catalog/application/manage-availability.use-case';
import type { PublicMenuCandidates } from '../../src/catalog/application/public-menu.repository.types';
import { PostgresAdminCatalogRepository } from '../../src/catalog/adapters/postgres-admin-catalog.repository';
import { PostgresPublicMenuRepository } from '../../src/catalog/adapters/postgres-public-menu.repository';
import { assertProductDetails, ProductAdminError } from '../../src/catalog/domain/product-admin.policy';

const timestamp = new Date('2026-08-16T12:00:00.000Z');

describe('catalog pricing and availability coverage', () => {
  it('reads complete catalog candidates before public availability filtering', async () => {
    const { client, repository } = publicMenuRepository();

    await expect(repository.findCandidates()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [{ id: 'coffee', name: 'Coffee', description: 'Drinks', sortOrder: 0, isActive: true, archivedAt: null }],
      products: [{ id: 'cappuccino', categoryId: 'coffee', type: 'DRINK', name: 'Cappuccino', description: 'Milk coffee', price: null, sortOrder: 0, isActive: true, isAvailable: true, archivedAt: null }],
      productVariants: [{ id: 'medium', productId: 'cappuccino', size: 'M', price: 320, sortOrder: 0, isAvailable: true, archivedAt: null }],
      modifierGroups: [{ id: 'milk', name: 'Milk', selectionType: 'single', minSelect: 1, maxSelect: 1, isActive: true, archivedAt: null }],
      modifierOptions: [{ id: 'oat', groupId: 'milk', name: 'Oat', priceDelta: 80, sortOrder: 0, isDefault: false, isAvailable: true, archivedAt: null }],
      categoryModifierGroups: [{ categoryId: 'coffee', groupId: 'milk', sortOrder: 0 }],
    });
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['type', { type: 'UNKNOWN' }],
    ['size', { size: 'XL' }],
    ['selection type', { selection_type: 'many' }],
    ['price', { price: -1 }],
  ])('rejects invalid PostgreSQL %s before publishing menu', async (_name, invalidRow) => {
    const { client, repository } = publicMenuRepository(invalidRow);

    await expect(repository.findCandidates()).rejects.toThrow('Invalid PostgreSQL row field');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('keeps available drink sizes, omits archived options, and rejects invalid price shapes', async () => {
    const candidates = catalogCandidates();
    candidates.productVariants.push({ id: 'archived', productId: 'cappuccino', size: 'S', price: 280, sortOrder: 1, isAvailable: false, archivedAt: timestamp });
    candidates.modifierOptions.push({ id: 'archived-oat', groupId: 'milk', name: 'Old oat', priceDelta: 10, sortOrder: 1, isDefault: false, isAvailable: true, archivedAt: timestamp });

    const menu = await publicMenu(candidates);
    expect(menu.categories[0]?.products[0]).toMatchObject({
      id: 'cappuccino',
      variants: [{ id: 'medium', price: 320, isAvailable: true }],
      modifierGroups: [{ options: [{ id: 'regular', priceDelta: 0 }] }],
    });

    candidates.products[0]!.price = 1;
    await expect(publicMenu(candidates)).resolves.toEqual({ acceptsNewOrders: true, categories: [] });
  });

  it('preserves audit target for each availability type and rejects missing target', async () => {
    for (const type of ['product', 'variant', 'modifier'] as const) {
      const { client, repository } = adminRepository([
        { rows: [] }, { rows: [] }, { rows: [{ id: `${type}-id`, is_available: true }] },
        { rows: [{ id: `${type}-id`, is_available: false }] }, { rows: [] }, { rows: [] },
      ]);

      await expect(repository.updateAvailability({ type, id: `${type}-id`, isAvailable: false, actorId: 'staff', requestId: 'request' })).resolves.toEqual({ type, id: `${type}-id`, isAvailable: false });
      expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO audit_events'), expect.arrayContaining(['staff', type === 'modifier' ? 'modifier_option' : type]));
    }

    const { client, repository } = adminRepository([{ rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }]);
    await expect(repository.updateAvailability({ type: 'variant', id: 'missing', isAvailable: false, actorId: 'staff', requestId: 'request' })).rejects.toBeInstanceOf(AvailabilityNotFoundError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('writes service intake audit with previous and current operator state', async () => {
    const { client, repository } = adminRepository([
      { rows: [] }, { rows: [] },
      { rows: [{ id: 'accepts_new_orders', value: true, updated_by: 'owner', updated_by_label: null, updated_at: timestamp }] },
      { rows: [{ id: 'accepts_new_orders', value: false, updated_by: 'staff', updated_by_label: '+79991234567', updated_at: timestamp }] },
      { rows: [] }, { rows: [] },
    ]);

    await expect(repository.updateServiceIntake({ acceptsNewOrders: false, actorId: 'staff', requestId: 'request' })).resolves.toEqual({ acceptsNewOrders: false, updatedBy: 'staff', updatedByLabel: '+79991234567', updatedAt: timestamp });
    expect(client.query.mock.calls[4]?.[1]?.[2]).toContain('"updatedByLabel":null');
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('SERVICE_INTAKE_UPDATED'), expect.arrayContaining(['staff', 'accepts_new_orders']));
  });

  it('requires price only for OTHER and available size for active drinks', () => {
    expect(() => assertProductDetails({ categoryId: 'coffee', type: 'OTHER', name: 'Cookie', description: '', price: null, sortOrder: 0, isActive: true, isAvailable: true, variants: [] })).toThrow(ProductAdminError);
    expect(() => assertProductDetails({ categoryId: 'coffee', type: 'DRINK', name: 'Cappuccino', description: '', price: null, sortOrder: 0, isActive: true, isAvailable: true, variants: [{ size: 'M', price: 320, sortOrder: 0, isAvailable: false }] })).toThrow(ProductAdminError);
    expect(() => assertProductDetails({ categoryId: 'coffee', type: 'OTHER', name: 'Cookie', description: '', price: 120, sortOrder: 0, isActive: true, isAvailable: true, variants: [] })).not.toThrow();
  });
});

function publicMenuRepository(invalidRow: Record<string, unknown> = {}) {
  const client = {
    query: jest.fn((sql: string) => Promise.resolve({ rows: rowsForPublicMenu(sql, invalidRow) })),
    release: jest.fn(),
  };
  const pool = { connect: jest.fn().mockResolvedValue(client) };
  return { client, repository: new PostgresPublicMenuRepository(pool as unknown as Pool) };
}

function rowsForPublicMenu(sql: string, invalidRow: Record<string, unknown>) {
  if (sql.includes('FROM service_settings')) return [{ value: true }];
  if (sql.includes('FROM categories')) return [{ id: 'coffee', name: 'Coffee', description: 'Drinks', sort_order: 0, is_active: true, archived_at: null }];
  if (sql.includes('FROM products')) return [{ id: 'cappuccino', category_id: 'coffee', type: 'DRINK', name: 'Cappuccino', description: 'Milk coffee', price: null, sort_order: 0, is_active: true, is_available: true, archived_at: null, ...invalidRow }];
  if (sql.includes('FROM product_variants')) return [{ id: 'medium', product_id: 'cappuccino', size: 'M', price: 320, sort_order: 0, is_available: true, archived_at: null, ...invalidRow }];
  if (sql.includes('FROM modifier_groups')) return [{ id: 'milk', name: 'Milk', selection_type: 'single', min_select: 1, max_select: 1, is_active: true, archived_at: null, ...invalidRow }];
  if (sql.includes('FROM modifier_options')) return [{ id: 'oat', group_id: 'milk', name: 'Oat', price_delta: 80, sort_order: 0, is_default: false, is_available: true, archived_at: null, ...invalidRow }];
  if (sql.includes('FROM category_modifier_groups')) return [{ category_id: 'coffee', group_id: 'milk', sort_order: 0 }];
  return [];
}

function adminRepository(results: { rows: Record<string, unknown>[] }[]) {
  const client = { query: jest.fn().mockImplementation(() => Promise.resolve(results.shift() ?? { rows: [] })), release: jest.fn() };
  const pool = { connect: jest.fn().mockResolvedValue(client) };
  return { client, repository: new PostgresAdminCatalogRepository(pool as unknown as Pool) };
}

function catalogCandidates(): PublicMenuCandidates {
  return {
    acceptsNewOrders: true,
    categories: [{ id: 'coffee', name: 'Coffee', description: 'Drinks', sortOrder: 0, isActive: true, archivedAt: null }],
    products: [{ id: 'cappuccino', categoryId: 'coffee', type: 'DRINK', name: 'Cappuccino', description: 'Milk coffee', price: null, sortOrder: 0, isActive: true, isAvailable: true, archivedAt: null }],
    productVariants: [{ id: 'medium', productId: 'cappuccino', size: 'M', price: 320, sortOrder: 0, isAvailable: true, archivedAt: null }],
    modifierGroups: [{ id: 'milk', name: 'Milk', selectionType: 'single', minSelect: 1, maxSelect: 1, isActive: true, archivedAt: null }],
    modifierOptions: [{ id: 'regular', groupId: 'milk', name: 'Regular', priceDelta: 0, sortOrder: 0, isDefault: true, isAvailable: true, archivedAt: null }],
    categoryModifierGroups: [{ categoryId: 'coffee', groupId: 'milk', sortOrder: 0 }],
  };
}

function publicMenu(candidates: PublicMenuCandidates) {
  return new GetPublicMenuUseCase({ findCandidates: jest.fn().mockResolvedValue(candidates) }).execute();
}
