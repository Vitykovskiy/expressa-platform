---
title: Операционный запуск
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../deploy/deploy.sh
  - ../../deploy/compose.yml
---

# Операционный запуск

Поддерживаемая поставка выполняется workflow, а не ручной пересборкой: remote
script читает VPS `runtime.env`, валидирует ключи, применяет compose, ждёт
PostgreSQL, запускает миграции и seed, затем проверяет сервисы. [Deploy script](../../deploy/deploy.sh),
[remote runner](../../deploy/run-remote.sh).

До первой поставки оператор создаёт `/srv/expressa/development` и
`/srv/expressa/staging` с `runtime.env` и каталогом `state` для `flock`; на VPS
должны быть Docker с Compose, локальный registry `127.0.0.1:5000`, внешние
`expressa-<environment>-edge` и `expressa-<environment>-data`, а для CI
настроены SSH user/key/known-hosts. `runtime.env` хранит PostgreSQL/auth/CORS
секреты и environment-специфичный OTP provider, но не digest образов.
[Deploy preconditions](../../deploy/deploy.sh), [Compose networks](../../deploy/compose.yml),
[workflow SSH](../../.github/workflows/staging-deploy.yml).

Для диагностики используются backend `/health/live` и `/health/ready`, client
`/health` и container health-checks. Значения `runtime.env` — секреты и не
выводятся. [Compose](../../deploy/compose.yml), [backend health](../../backend/src/platform/health/health.controller.ts).

Manual production rollout, backup/restore и alert response не определены как
поддерживаемые операции. [Environments](Environments.md), [Backup](Backup-and-restore.md),
[Observability](Observability.md).
