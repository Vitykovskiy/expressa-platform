export type ObservabilityMetricsSnapshot = {
  apiErrorsTotal: number;
  httpRequestsTotal: number;
  readinessFailuresTotal: number;
  responsesByStatusClass: Record<string, number>;
};
