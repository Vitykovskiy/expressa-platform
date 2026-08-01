import { ObservabilityMetrics } from './observability-metrics.service';

describe('ObservabilityMetrics', () => {
  it('считает HTTP, API errors и недоступность readiness', () => {
    const metrics = new ObservabilityMetrics();

    metrics.recordHttpResponse(200);
    metrics.recordHttpResponse(503);
    metrics.recordApiError();
    metrics.recordReadinessFailure();

    expect(metrics.snapshot()).toEqual({
      apiErrorsTotal: 1,
      httpRequestsTotal: 2,
      readinessFailuresTotal: 1,
      responsesByStatusClass: { '2xx': 1, '5xx': 1 },
    });
  });
});
