import type { Pool, PoolClient } from 'pg';
import { PostgresCatalogCommandRunner } from './postgres-catalog-command.runner';
import { PostgresCategoryModifiersRepository } from './postgres-category-modifiers.repository';

const categoryId = '73444b86-4c6f-459e-871d-0f7995c1af36';
const firstGroupId = 'a3444b86-4c6f-459e-871d-0f7995c1af36';
const secondGroupId = 'b3444b86-4c6f-459e-871d-0f7995c1af36';
const groupIds = [firstGroupId, secondGroupId];

function setup() {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const client = { query, release: jest.fn() } as unknown as jest.Mocked<PoolClient>;
  const pool = { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool;
  return { query, repository: new PostgresCategoryModifiersRepository(new PostgresCatalogCommandRunner(pool)) };
}

describe('PostgresCategoryModifiersRepository', () => {
  it('заменяет связи в заданном порядке и пишет аудит в той же транзакции', async () => {
    const { query, repository } = setup();
    const before = [{ categoryId, groupId: secondGroupId, sortOrder: 0 }];
    const after = groupIds.map((groupId, sortOrder) => ({ categoryId, groupId, sortOrder }));
    query.mockImplementation((text: string) => {
      if (text.includes('FROM categories')) return Promise.resolve({ rows: [{ id: categoryId }] });
      if (text.includes('FROM modifier_groups')) return Promise.resolve({ rows: groupIds.map((id) => ({ id })) });
      if (text.includes('SELECT category_id, group_id, sort_order')) return Promise.resolve({ rows: [{ category_id: categoryId, group_id: secondGroupId, sort_order: 0 }] });
      if (text.includes('INSERT INTO category_modifier_groups')) return Promise.resolve({ rows: after.map((value) => ({ category_id: value.categoryId, group_id: value.groupId, sort_order: value.sortOrder })) });
      return Promise.resolve({ rows: [] });
    });

    await repository.run(async (transaction) => {
      expect(await transaction.categoryExists(categoryId)).toBe(true);
      expect(await transaction.findCurrentModifierGroupIds(groupIds)).toEqual(groupIds);
      expect(await transaction.findByCategoryId(categoryId)).toEqual(before);
      return transaction.replace(categoryId, groupIds);
    }, (transaction, result) => transaction.writeAudit({ actorId: 'actor-id', requestId: 'request-id', categoryId, before, after: result }));

    expect(query.mock.calls.some(([text]) => typeof text === 'string' && text.includes('DELETE FROM category_modifier_groups'))).toBe(true);
    const insert = query.mock.calls.find(([text]) => typeof text === 'string' && text.includes('INSERT INTO category_modifier_groups'));
    expect(insert?.[1]).toEqual([categoryId, groupIds]);
    const audit = query.mock.calls.find(([text]) => typeof text === 'string' && text.includes('INSERT INTO audit_events'));
    expect(audit?.[1]).toEqual([
      'actor-id', categoryId, JSON.stringify(before), JSON.stringify(after), 'request-id',
    ]);
  });

  it('не создаёт строк для пустого упорядоченного набора', async () => {
    const { query, repository } = setup();

    await expect(repository.run((transaction) => transaction.replace(categoryId, []), async () => undefined)).resolves.toEqual([]);

    expect(query.mock.calls.some(([text]) => typeof text === 'string' && text.includes('DELETE FROM category_modifier_groups'))).toBe(true);
    expect(query.mock.calls.some(([text]) => typeof text === 'string' && text.includes('INSERT INTO category_modifier_groups'))).toBe(false);
  });
});
