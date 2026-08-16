import { MetricsController } from './observability.module';

describe('MetricsController', () => {
  it.each([
    ['доступна', jest.fn().mockResolvedValue({ rows: [] }), true],
    ['недоступна', jest.fn().mockRejectedValue(new Error('database unavailable')), false],
  ])('публикует readiness, когда PostgreSQL %s', async (_state, query, expectedReadiness) => {
    const metrics = {
      prometheus: jest.fn().mockResolvedValue('expressa_backend_readiness 1'),
      recordBackendReadiness: jest.fn(),
    };
    const controller = new MetricsController(
      { connectionPool: { query } } as never,
      metrics as never,
    );

    await expect(controller.getMetrics()).resolves.toBe('expressa_backend_readiness 1');
    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(metrics.recordBackendReadiness).toHaveBeenCalledWith(expectedReadiness);
  });
});
