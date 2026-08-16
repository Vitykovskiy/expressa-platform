---
title: Наблюдаемость
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../backend/src/platform/observability/request-observability.middleware.ts
  - ../../backend/src/platform/observability/observability-metrics.service.ts
  - ../../deploy/ops-compose.yml
---

# Наблюдаемость

Backend выдаёт `/health/live` для процесса, `/health/ready` после PostgreSQL и
непрефиксный `/metrics` для Prometheus. Каждый scrape `/metrics` выполняет
`SELECT 1` через существующий PostgreSQL boundary и публикует
`expressa_backend_readiness`: `1` при успехе, `0` при ошибке. Compose health-check backend использует live, а deploy
script проверяет готовность после миграций. [Health controller](../../backend/src/platform/health/health.controller.ts),
[метрики](../../backend/src/platform/observability/observability-metrics.service.ts),
[Compose](../../deploy/compose.yml), [deploy](../../deploy/deploy.sh).

Middleware выдаёт/принимает корректный `x-request-id`, пишет JSON request event;
filter добавляет requestId в безопасный error envelope. Метрики считают HTTP по
шаблону пути и классу статуса, API errors, неуспешные OTP request/verify,
отказы readiness, новые заказы и переходы заказа. [Middleware](../../backend/src/platform/observability/request-observability.middleware.ts),
[filter](../../backend/src/platform/observability/unified-exception.filter.ts),
[metrics](../../backend/src/platform/observability/observability-metrics.service.ts).

`deploy/ops-compose.yml` запускается отдельно для одной среды и подключается к
её edge-сети. Он содержит закреплённые образы Prometheus, Grafana, Alertmanager
и node-exporter. Grafana получает readiness PostgreSQL, 5xx, OTP failures,
заказов и резервных копий. Prometheus вызывает alerts при недоступности backend,
росте 5xx и отсутствии суточной копии. Alert readiness срабатывает при backend
down, отсутствии gauge либо значении `0`. Перед запуском оператор задаёт
`DEPLOY_ENV`, `GRAFANA_ADMIN_PASSWORD`, `BACKUP_METRICS_DIRECTORY` и
`ALERTMANAGER_CONFIG_FILE`. Политика оператора требует, чтобы последний указывал
на абсолютный обычный файл
`/etc/expressa/alertmanager/alertmanager.yml`, принадлежащий `expressa` с
режимом `0600`; symlink не допускается. Compose лишь потребляет указанный путь,
монтирует его в Alertmanager только для чтения и не создаёт его. Эта policy
относится к запуску `ops-compose.yml` на host. Адрес получателя и credentials
остаются только в этом host-owned файле, не в Git или workflow-логах. [Ops compose](../../deploy/ops-compose.yml),
[alerts](../../deploy/prometheus/alerts.yml),
[dashboard](../../deploy/grafana/dashboards/expressa-operations.json).

`operations-verification.yml` проверяет delivery Alertmanager изолированно:
Prometheus передаёт test alert временному receiver, который подтверждает
состояния `firing` и `resolved`. Получатель и evidence удаляются cleanup;
санитизированный artifact хранит только acknowledgement; host
`ALERTMANAGER_CONFIG_FILE` этот workflow не использует.
