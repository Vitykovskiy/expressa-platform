---
title: Наблюдаемость
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/platform/observability/request-observability.middleware.ts
  - ../../deploy/compose.yml
---

# Наблюдаемость

Backend выдаёт `/health/live` для процесса и `/health/ready` после PostgreSQL.
Compose health-check backend использует live, а deploy script проверяет готовность
после миграций. [Health controller](../../backend/src/platform/health/health.controller.ts),
[Compose](../../deploy/compose.yml), [deploy](../../deploy/deploy.sh).

Middleware выдаёт/принимает корректный `x-request-id`, пишет JSON request event;
filter добавляет requestId в безопасный error envelope, а внутренние счётчики
ведут HTTP, API error и readiness failure. [Middleware](../../backend/src/platform/observability/request-observability.middleware.ts),
[filter](../../backend/src/platform/observability/unified-exception.filter.ts),
[metrics](../../backend/src/platform/observability/observability-metrics.service.ts).

Экспорт метрик, панель и оповещения не реализованы; поэтому это диагностические
возможности процесса, а не настроенная служба мониторинга. [Metrics service](../../backend/src/platform/observability/observability-metrics.service.ts).
