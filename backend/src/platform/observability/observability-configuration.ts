import type { INestApplication } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ObservabilityLogger } from "./observability-logger.service";
import { ObservabilityMetrics } from "./observability-metrics.service";
import { RequestObservabilityMiddleware } from "./request-observability.middleware";
import { UnifiedExceptionFilter } from "./unified-exception.filter";

export function configureObservability(app: INestApplication): void {
  const requestMiddleware = app.get(RequestObservabilityMiddleware);

  app.use(requestMiddleware.use.bind(requestMiddleware));
  app.useGlobalFilters(
    new UnifiedExceptionFilter(
      app.get(HttpAdapterHost),
      app.get(ObservabilityLogger),
      app.get(ObservabilityMetrics),
    ),
  );
}
