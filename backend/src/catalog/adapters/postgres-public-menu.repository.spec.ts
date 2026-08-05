import type { Pool, PoolClient } from 'pg';
import { acceptsNewOrdersSettingKey } from '../domain/catalog.constants';
import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from './catalog-advisory-lock.constants';
import { PostgresPublicMenuRepository } from './postgres-public-menu.repository';

function createRepository(): {
  client: jest.Mocked<PoolClient>;
  pool: jest.Mocked<Pick<Pool, 'connect'>>;
  query: jest.Mock;
  repository: PostgresPublicMenuRepository;
} {
  const query = jest.fn((sql: string) => Promise.resolve({
    rows: sql.includes('FROM service_settings') ? [{ value: true }] : [],
  }));
  const client = {
    query,
    release: jest.fn(),
  } as unknown as jest.Mocked<PoolClient>;
  const pool = {
    connect: jest.fn().mockResolvedValue(client),
  } as jest.Mocked<Pick<Pool, 'connect'>>;

  return {
    client,
    pool,
    query,
    repository: new PostgresPublicMenuRepository(pool as unknown as Pool),
  };
}

describe('PostgresPublicMenuRepository', () => {
  it('читает меню под разделяемой блокировкой через один клиент', async () => {
    const { client, pool, repository } = createRepository();

    await expect(repository.findCandidates()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [],
      products: [],
      productVariants: [],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
    });

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM service_settings'),
      [acceptsNewOrdersSettingKey],
    );
    expect(client.query).toHaveBeenNthCalledWith(10, 'COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('откатывает транзакцию и освобождает клиент при ошибке запроса каталога', async () => {
    const { client, query, repository } = createRepository();
    const error = new Error('read failed');

    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ value: true }] })
      .mockRejectedValueOnce(error);

    await expect(repository.findCandidates()).rejects.toThrow(error);

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);
    expect(client.query).toHaveBeenNthCalledWith(10, 'ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('откатывает транзакцию до фиксации, если строка каталога не проходит проверку', async () => {
    const { client, query, repository } = createRepository();

    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ value: true }] })
      .mockResolvedValueOnce({ rows: [{ id: null }] });

    await expect(repository.findCandidates()).rejects.toThrow(
      'Invalid PostgreSQL row field: id',
    );

    expect(client.query).toHaveBeenNthCalledWith(10, 'ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['отсутствует', []],
    ['дублируется', [{ value: true }, { value: false }]],
    ['не является boolean', [{ value: 'true' }]],
  ])('откатывает транзакцию, если настройка приёма заказов %s', async (_description, rows) => {
    const { client, query, repository } = createRepository();

    query.mockImplementation((sql: string) => Promise.resolve({
      rows: sql.includes('FROM service_settings') ? rows : [],
    }));

    await expect(repository.findCandidates()).rejects.toThrow(
      'Invalid PostgreSQL service setting: accepts_new_orders',
    );

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM service_settings'),
      [acceptsNewOrdersSettingKey],
    );
    expect(client.query).toHaveBeenNthCalledWith(10, 'ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
