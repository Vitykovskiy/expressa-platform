import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Registry } from 'prom-client';

export type ObservabilityMetricsSnapshot = {
  apiErrorsTotal: number;
  httpRequestsTotal: number;
  readinessFailuresTotal: number;
  responsesByStatusClass: Record<string, number>;
};

@Injectable()
export class ObservabilityMetrics {
  private static readonly registry = new Registry();
  private static readonly apiErrors = new Counter({
    name: 'expressa_api_errors_total',
    help: 'Total API errors returned by Expressa.',
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly httpResponses = new Counter({
    name: 'expressa_http_responses_total',
    help: 'Total HTTP responses returned by Expressa.',
    labelNames: ['path', 'status_class'] as const,
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly otpFailures = new Counter({
    name: 'expressa_otp_failures_total',
    help: 'Total failed OTP request and verification responses.',
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly readinessFailures = new Counter({
    name: 'expressa_readiness_failures_total',
    help: 'Total failed PostgreSQL readiness checks.',
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly backendReadiness = new Gauge({
    name: 'expressa_backend_readiness',
    help: 'Current PostgreSQL readiness observed by the metrics scrape.',
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly ordersCreated = new Counter({
    name: 'expressa_orders_created_total',
    help: 'Total newly created orders, excluding idempotency replays.',
    registers: [ObservabilityMetrics.registry],
  });
  private static readonly orderTransitions = new Counter({
    name: 'expressa_order_transitions_total',
    help: 'Total committed order transitions by resulting stage.',
    labelNames: ['stage'] as const,
    registers: [ObservabilityMetrics.registry],
  });
  private apiErrorsTotal = 0;
  private httpRequestsTotal = 0;
  private readinessFailuresTotal = 0;
  private readonly responsesByStatusClass: Record<string, number> = {};

  recordApiError(): void {
    this.apiErrorsTotal += 1;
    ObservabilityMetrics.apiErrors.inc();
  }

  recordHttpResponse(statusCode: number, requestPath = '/'): void {
    this.httpRequestsTotal += 1;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;

    this.responsesByStatusClass[statusClass] =
      (this.responsesByStatusClass[statusClass] ?? 0) + 1;
    ObservabilityMetrics.httpResponses.inc({
      path: requestPath,
      status_class: statusClass,
    });
  }

  recordOtpFailure(): void {
    ObservabilityMetrics.otpFailures.inc();
  }

  recordReadinessFailure(): void {
    this.readinessFailuresTotal += 1;
    ObservabilityMetrics.readinessFailures.inc();
  }

  recordBackendReadiness(isReady: boolean): void {
    ObservabilityMetrics.backendReadiness.set(isReady ? 1 : 0);
  }

  static recordOrderCreated(): void {
    ObservabilityMetrics.ordersCreated.inc();
  }

  static recordOrderTransition(stage: string): void {
    ObservabilityMetrics.orderTransitions.inc({ stage });
  }

  async prometheus(): Promise<string> {
    return ObservabilityMetrics.registry.metrics();
  }

  contentType(): string {
    return ObservabilityMetrics.registry.contentType;
  }

  snapshot(): ObservabilityMetricsSnapshot {
    return {
      apiErrorsTotal: this.apiErrorsTotal,
      httpRequestsTotal: this.httpRequestsTotal,
      readinessFailuresTotal: this.readinessFailuresTotal,
      responsesByStatusClass: { ...this.responsesByStatusClass },
    };
  }
}
