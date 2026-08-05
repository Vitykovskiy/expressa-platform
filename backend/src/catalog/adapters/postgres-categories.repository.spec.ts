import type { Pool, PoolClient } from 'pg';
import { PostgresCatalogCommandRunner } from './postgres-catalog-command.runner';
import { PostgresCategoriesRepository } from './postgres-categories.repository';

const row = {
  id: 'category-id', name: 'Кофе', description: 'Напитки', sort_order: 0, is_active: true, archived_at: null,
};

function setup() {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const client = { query, release: jest.fn() } as unknown as jest.Mocked<PoolClient>;
  const pool = { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool;
  return { client, query, repository: new PostgresCategoriesRepository(new PostgresCatalogCommandRunner(pool)) };
}

describe('PostgresCategoriesRepository', () => {
  it('переупорядочивает полный набор временными bounded позициями в одной транзакции', async () => {
    const { query, repository } = setup();
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row, { ...row, id: 'tea', name: 'Чай', sort_order: 1 }] });
    const categories = [
      { id: 'category-id', name: 'Кофе', description: 'Напитки', sortOrder: 2_147_483_647, isActive: true, archivedAt: null },
      { id: 'tea', name: 'Чай', description: 'Напитки', sortOrder: 0, isActive: true, archivedAt: null },
    ];

    await expect(repository.run((transaction) => transaction.reorder(categories, ['category-id', 'tea']), async () => undefined)).resolves.toEqual([
      { id: 'category-id', name: 'Кофе', description: 'Напитки', sortOrder: 0, isActive: true, archivedAt: null },
      { id: 'tea', name: 'Чай', description: 'Напитки', sortOrder: 1, isActive: true, archivedAt: null },
    ]);
    expect(query.mock.calls[2]?.[0]).toContain('SET is_active = false');
    expect(query.mock.calls[3]?.[0]).toContain('ordered.sort_order + $2');
    expect(query.mock.calls[3]?.[1]).toEqual([['category-id', 'tea'], 1]);
    expect(query.mock.calls[4]?.[0]).toContain('ordered.sort_order - 1');
    expect(query.mock.calls[5]?.[0]).toContain('SET is_active = true');
    expect(query.mock.calls[6]?.[0]).toContain('SELECT id, name, description');
  });

  it('сохраняет аудит с автором, requestId и точными состояниями', async () => {
    const { query, repository } = setup();
    const before = { id: 'category-id', name: 'Кофе', description: 'Напитки', sortOrder: 0, isActive: true, archivedAt: null };
    const after = { ...before, name: 'Чай', sortOrder: 1 };

    await repository.run(async () => undefined, (transaction) => transaction.writeAudit({
      actorId: 'actor-id', requestId: 'request-id', action: 'CATEGORY_UPDATED', categoryId: 'category-id', before, after,
    }));

    expect(query.mock.calls[2]?.[0]).toContain('INSERT INTO audit_events');
    expect(query.mock.calls[2]?.[1]).toEqual([
      'actor-id', 'category-id', 'CATEGORY_UPDATED', JSON.stringify(before), JSON.stringify(after), 'request-id',
    ]);
  });

  it('создаёт, обновляет и архивирует категории с возвращаемым состоянием', async () => {
    const { query, repository } = setup();
    query.mockImplementation((text: string) => {
      if (text.includes('INSERT INTO categories')) return Promise.resolve({ rows: [row] });
      if (text.includes('archived_at = CURRENT_TIMESTAMP')) return Promise.resolve({ rows: [{ ...row, archived_at: new Date('2026-08-04T00:00:00.000Z') }] });
      if (text.includes('SET name =')) return Promise.resolve({ rows: [{ ...row, name: 'Чай' }] });
      return Promise.resolve({ rows: [] });
    });

    await expect(repository.run((transaction) => transaction.create({ name: 'Кофе', description: 'Напитки', sortOrder: 0, isActive: true }), async () => undefined)).resolves.toMatchObject({ id: 'category-id' });
    await expect(repository.run((transaction) => transaction.update('category-id', { name: 'Чай', description: 'Напитки', sortOrder: 0, isActive: true }), async () => undefined)).resolves.toMatchObject({ name: 'Чай' });
    await expect(repository.run((transaction) => transaction.archive('category-id'), async () => undefined)).resolves.toMatchObject({ archivedAt: new Date('2026-08-04T00:00:00.000Z') });
  });
});
