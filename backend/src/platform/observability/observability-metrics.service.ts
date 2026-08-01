import { Injectable } from '@nestjs/common';

export type ObservabilityMetricsSnapshot = {
  apiErrorsTotal: number;
  httpRequestsTotal: number;
  readinessFailuresTotal: number;
  responsesByStatusClass: Record<string, number>;
};

@Injectable()
export class ObservabilityMetrics {
  private apiErrorsTotal = 0;
  private httpRequestsTotal = 0;
  private readinessFailuresTotal = 0;
  private readonly responsesByStatusClass: Record<string, number> = {};

  recordApiError(): void {
    this.apiErrorsTotal += 1;
  }

  recordHttpResponse(statusCode: number): void {
    this.httpRequestsTotal += 1;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;

    this.responsesByStatusClass[statusClass] =
      (this.responsesByStatusClass[statusClass] ?? 0) + 1;
  }

  recordReadinessFailure(): void {
    this.readinessFailuresTotal += 1;
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
