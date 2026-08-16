---
title: Операционный запуск
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../deploy/deploy.sh
  - ../../deploy/compose.yml
  - ../../deploy/smoke-production.mjs
  - ../../.github/workflows/production-promotion.yml
---

# Операционный запуск

Поддерживаемая поставка выполняется workflow, а не ручной пересборкой: remote
script читает VPS `runtime.env`, валидирует ключи, применяет compose, ждёт
PostgreSQL, запускает миграции и seed, затем проверяет сервисы. [Deploy script](../../deploy/deploy.sh),
[remote runner](../../deploy/run-remote.sh).

До первой поставки оператор создаёт `/srv/expressa/development`,
`/srv/expressa/staging` и `/srv/expressa/production` с `runtime.env` и каталогом `state` для `flock`; на VPS
должны быть Docker с Compose, локальный registry `127.0.0.1:5000`, внешние
`expressa-<environment>-edge` и `expressa-<environment>-data`, а для CI
настроены SSH user/key/known-hosts. Для staging workflow передаёт через SSH
синтетический staff `BOOTSTRAP_ADMIN_PHONE` и auth/CORS-секреты. Все workflow
передают VAPID credentials только через NUL-разделённый SSH stdin: remote
runner именует их `DELIVERY_VAPID_*`, а `deploy.sh` после чтения `runtime.env`
заменяет ими процессные `VAPID_*` и сразу удаляет `DELIVERY_VAPID_*`. Эти
credentials не сохраняются в `runtime.env`, временном каталоге или логах.
`deploy.sh`
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
пишут только именные evidence-маркеры `expressa-release-evidence: check=… status=passed`
или `expressa-staging-smoke: check=… status=passed`. Маркеры подтверждают
проверку, но не содержат телефон, OTP, токен, URL или идентификатор заказа.

Для диагностики используются backend `/health/live` и `/health/ready`, client
`/health` и container health-checks. Значения `runtime.env` — секреты и не
выводятся. [Compose](../../deploy/compose.yml), [backend health](../../backend/src/platform/health/health.controller.ts).

Для наблюдаемости оператор запускает отдельный `ops-compose.yml` в edge-сети
среды и проверяет непрефиксный backend `/metrics`, панель Grafana и targets
Prometheus. При alert readiness/5xx
сначала проверяет `/health/ready`, затем backend logs с `x-request-id`; при
backup alert — состояние `expressa-backup.timer`, каталог копий и текстовую
метрику node-exporter. Получатель alert настраивается вне Git. [Наблюдаемость](Observability.md),
[backup/restore](Backup-and-restore.md).

Перед выпуском оператор запускает изолированную проверку восстановления только
на тестовой копии и сохраняет её безопасный evidence-маркер с RPO/RTO. После
приёмки staging владелец репозитория вручную запускает production workflow из
`main` с `confirm_production=true` и тегом `staging-v*`. До secrets и SSH
workflow проверяет эти условия; `environment: production` остаётся только
меткой аудита и поставки. Workflow проверяет успешную staging-приёмку и точный
трёхкомпонентный manifest, затем запускает migration, seed, health и API smoke
в изолированной production-среде. Production `runtime.env` с PostgreSQL, auth,
SMS и bootstrap-секретами
предварительно создаются на VPS; [production.env.example](../../deploy/production.env.example)
показывает только форму manifest и не используется для поставки.

Проверка операций запускается вручную только из `main` workflow
`operations-verification.yml` с `confirm_operations_verification=true`. Она
использует Environment `development`, не запускает staging или production
поставку, создаёт backup, проверяет isolated restore с public-menu smoke и
безопасный test receiver Alertmanager. Артефакт
`development-operations-evidence-<run_id>` содержит только имя копии, revision,
фактические RPO/RTO с целями и acknowledgement test receiver; он не содержит
секретов, URL или credentials. До успешного run этот артефакт и фактические
значения остаются pending. [Operations workflow](../../.github/workflows/operations-verification.yml).
