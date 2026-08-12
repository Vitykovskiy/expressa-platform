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
настроены SSH user/key/known-hosts. Для staging workflow передаёт через SSH
синтетический staff `BOOTSTRAP_ADMIN_PHONE` и auth/CORS-секреты; `deploy.sh`
включает `staging_test` с фиксированным OTP. Allowlist содержит ровно этот staff
и customer `+79990000001`; другие номера OTP не получают. После health-checks
поставка автоматически запускает smoke: customer создаёт заказ, staff проверяет
E08/E09 — запреты ролей и неверного перехода, последовательность
`CREATED`–`ACCEPTED`–`PREPARING`–`READY`–`ISSUED` и четыре события. Smoke
оставляет синтетический заказ и аудит. `runtime.env` хранит пароль PostgreSQL,
но не digest образов; секреты не попадают в Git или логи.
[Deploy preconditions](../../deploy/deploy.sh), [Compose networks](../../deploy/compose.yml),
[workflow SSH](../../.github/workflows/staging-deploy.yml).

Автоматические migration, seed, внутренние health-проверки и staging smoke
пишут только именные evidence-маркеры `expressa-deploy: check=… status=passed`
или `expressa-staging-smoke: check=… status=passed`. Маркеры подтверждают
проверку, но не содержат телефон, OTP, токен, URL или идентификатор заказа.
Публичные health-проверки workflow используют URL-секреты, перечисленные в
[CI/CD](CI-CD.md).

Для диагностики используются backend `/health/live` и `/health/ready`, client
`/health` и container health-checks. Значения `runtime.env` — секреты и не
выводятся. [Compose](../../deploy/compose.yml), [backend health](../../backend/src/platform/health/health.controller.ts).

Manual production rollout, backup/restore и alert response не определены как
поддерживаемые операции. [Environments](Environments.md), [Backup](Backup-and-restore.md),
[Observability](Observability.md).
