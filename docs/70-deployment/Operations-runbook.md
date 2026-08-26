---
title: Операционный запуск
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../deploy/deploy.sh
  - ../../deploy/compose.yml
  - ../../deploy/smoke-production.mjs
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
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
передают VAPID credentials, а development также `AUTH_DEVELOPMENT_OTP`, только
через NUL-разделённый SSH stdin. Remote runner передаёт их `deploy.sh` для
текущего процесса поставки; эти значения не сохраняются в `runtime.env`,
временном каталоге или логах.
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

## Диск VPS

Перед очисткой оператор снимает только читаемый инвентарь `df`, `docker system df`,
контейнеров, образов, volume, networks, `/var/log` и `/tmp`. Защищены работающие
контейнеры и используемые ими digest образов, все volume и networks,
`/srv/expressa/<environment>/runtime.env` и копии в пределах срока хранения.
Удаляют только по инвентарю остановленные одноразовые контейнеры, неиспользуемые
образы и build cache, истёкшие копии и временные каталоги поставки. Команда
`docker system prune --volumes` не применяется: она может удалить данные
состояния. После очистки оператор повторяет инвентарь и health-проверки сред.

Перед созданием переменной окружения, GitHub Secret, SSH alias или Compose project
оператор сверяет существующие источники и корни сред: `/srv/expressa/<environment>`
с `runtime.env`, workflows и `deploy.sh` задают `expressa-<environment>`.

## Тестовые доступы и ротация

Публичные тестовые пользователи development и staging: customer
`+79990000001` и administrator `+79990000002`; OTP для обоих — `000000`.
Адреса Customer, Admin и API приведены в [средах](Environments.md).

Standalone E2E получает адреса сред из этой карты, а customer, administrator и
их OTP — из [CI/CD](CI-CD.md#Публичные-тестовые-доступы). В staging
`E2E_STAFF_PHONE` использует ту же существующую учётную запись администратора
`BOOTSTRAP_ADMIN_PHONE`: развёрнутый staging-контракт пропускает её при проверке
прав Staff. `E2E_STAFF_OTP` использует тот же фиксированный источник `staging_test`,
что указан в [CI/CD](CI-CD.md#Публичные-тестовые-доступы). Все значения
передаются только в окружение запуска Playwright и не создают отдельный
файл учётных данных, секрет или конфигурацию.

Для ротации administrator оператор заменяет `BOOTSTRAP_ADMIN_PHONE` на новый
номер формата `+7XXXXXXXXXX` в GitHub Environments `development` и `staging`.
Значение вводится только в интерфейсе GitHub Secrets и не помещается в команду,
Git, логи или `runtime.env`. Следующая поставка seed-ом создаёт либо обновляет
пользователя с ролью `administrator`.

Для восстановления development OTP оператор заменяет
`AUTH_DEVELOPMENT_OTP` в GitHub Environment `development`. Значение вводится
только в интерфейсе GitHub Secrets; workflow передаёт его NUL-разделённым stdin
только на время поставки, без записи в `runtime.env`, временный каталог или
логи.

После изменения GitHub Secret оператор запускает development
delivery из `main`; для staging повторно запускает deployment существующего
тега. Production не меняется. После успешной поставки проверяет оба API по
`/health/live` и `/health/ready`, вход customer и administrator с OTP `000000`,
роль `administrator` в Admin и staging smoke. Если ротация меняет номер,
обновляет таблицу [CI/CD](CI-CD.md) тем же change.

Для наблюдаемости оператор запускает отдельный `ops-compose.yml` в edge-сети
среды и проверяет непрефиксный backend `/metrics`, панель Grafana и targets
Prometheus. При alert readiness/5xx
сначала проверяет `/health/ready`, затем backend logs с `x-request-id`; при
backup alert — последний operations artifact, каталог копий и текстовую метрику
node-exporter. Получатель alert настраивается вне Git. [Наблюдаемость](Observability.md),
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

Проверка операций выполняется из `main` workflow
`operations-verification.yml` ежедневно по cron `0 2 * * *` или вручную с
`confirm_operations_verification=true`; concurrency не допускает параллельных
запусков. Она использует Environment `development`, не запускает staging или
production поставку, создаёт backup, проверяет isolated restore с public-menu
smoke и безопасный test receiver Alertmanager. Артефакт
`development-operations-evidence-<run_id>` содержит только имя копии, revision,
фактические RPO/RTO с целями и acknowledgement test receiver; он не содержит
секретов, URL или credentials. Run `31928673857` для
`930e71cc06b65bb685635a60621937a97e656087` подтвердил backup
`expressa-20260816T051813Z.sql.enc` с HMAC и метрикой, RPO `0/93600s`, RTO
`16/900s`, delivery `firing` и `resolved`; artifact
`development-operations-evidence-31928673857`. [Operations workflow](../../.github/workflows/operations-verification.yml).
