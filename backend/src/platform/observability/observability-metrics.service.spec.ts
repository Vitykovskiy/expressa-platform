import { ObservabilityMetrics } from './observability-metrics.service';

describe('ObservabilityMetrics', () => {
  it('считает HTTP, API errors и недоступность readiness', async () => {
    const metrics = new ObservabilityMetrics();

    metrics.recordHttpResponse(200, '/health/live');
    metrics.recordHttpResponse(
      503,
      '/api/v2/orders/:orderId',
    );
    metrics.recordApiError();
    metrics.recordReadinessFailure();

    expect(metrics.snapshot()).toEqual({
      apiErrorsTotal: 1,
      httpRequestsTotal: 2,
      readinessFailuresTotal: 1,
      responsesByStatusClass: { '2xx': 1, '5xx': 1 },
    });

    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_http_responses_total{path="/api/v2/orders/:orderId",status_class="5xx"} 1',
    );
  });

  it('публикует метрики заказов', async () => {
    const metrics = new ObservabilityMetrics();

    ObservabilityMetrics.recordOrderCreated();
    ObservabilityMetrics.recordOrderTransition('READY');

    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_orders_created_total 1',
    );
    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_order_transitions_total{stage="READY"} 1',
    );
  });

  it('публикует отдельный счётчик неуспешных OTP', async () => {
    const metrics = new ObservabilityMetrics();

    metrics.recordOtpFailure();

    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_otp_failures_total 1',
    );
  });

  it('публикует текущее значение PostgreSQL readiness', async () => {
    const metrics = new ObservabilityMetrics();

    metrics.recordBackendReadiness(true);
    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_backend_readiness 1',
    );

    metrics.recordBackendReadiness(false);
    await expect(metrics.prometheus()).resolves.toContain(
      'expressa_backend_readiness 0',
    );
  });
});
