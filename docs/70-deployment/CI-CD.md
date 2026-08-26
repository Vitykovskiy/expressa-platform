---
title: CI и поставка
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
  - ../../.github/workflows/production-promotion.yml
  - ../../.github/workflows/operations-verification.yml
---

# CI и поставка

PR-проверки запускаются отдельно для backend, front-office, back-office и
delivery scripts. Backend CI включает PostgreSQL integration/e2e, OpenAPI и
Docker build; client CI включает contract, UI и container проверки. [Backend CI](../../.github/workflows/backend-ci.yml),
[front CI](../../.github/workflows/front-office-ci.yml), [back CI](../../.github/workflows/back-office-ci.yml),
[delivery CI](../../.github/workflows/delivery-ci.yml).

После main три проверенных образа получают SHA-tag, публикуются в локальный
registry и передаются по digest в development. Staging проверяет manifest из
`deploy/staging.env` и развёртывает те же три digest без сборки. [Development](../../.github/workflows/development-delivery.yml),
[staging](../../.github/workflows/staging-deploy.yml). Ручной workflow production до доступа к secrets и SSH проверяет dispatch из `main`, владельца репозитория и `confirm_production=true`; затем принимает только `staging-v*` с успешной staging-приёмкой и развёртывает manifest этого тега. `environment: production` служит только меткой аудита и поставки. [Production](../../.github/workflows/production-promotion.yml).

GitHub SSH-переменные остаются входами runner для соединения с VPS и не
передаются на сервер. SCP копирует во временный VPS-каталог только `deploy.sh`,
`compose.yml`, smoke-скрипт и image manifest. Для staging stdin SSH передаёт
`BOOTSTRAP_ADMIN_PHONE`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_OTP_PEPPER` и
`CORS_ORIGINS`; все три workflow также получают environment secrets `VAPID_*`.
Remote script передаёт эти значения `deploy.sh` NUL-разделённым stdin как
`DELIVERY_VAPID_*`, не записывая их в `runtime.env` или временный каталог.
После чтения `runtime.env` `deploy.sh` экспортирует полученные `VAPID_*` только
для compose и удаляет `DELIVERY_VAPID_*` из окружения. Development workflow
передаёт `AUTH_DEVELOPMENT_OTP` из GitHub Environment `development`
NUL-разделённым stdin; `deploy.sh` использует его только для текущего процесса
поставки. Значение не сохраняется в `runtime.env`, временном каталоге или
логах. В staging он включает
`AUTH_OTP_MODE=staging_test`, OTP `000000` и allowlist из
`BOOTSTRAP_ADMIN_PHONE` и синтетического customer `+79990000001`. Значения
хранятся в GitHub Environment Secrets, не коммитятся в YAML, не печатаются и
не сохраняются в `runtime.env` или временном каталоге VPS. [Development deploy step](../../.github/workflows/development-delivery.yml),
[staging deploy step](../../.github/workflows/staging-deploy.yml),
[remote transfer](../../deploy/run-remote.sh), [проверка ключей](../../deploy/deploy.sh).

Источник соединения workflow — GitHub Environment Secrets `EXPRESSA_VPS_*`;
источник постоянных секретов среды — её VPS
`/srv/expressa/<environment>/runtime.env`; process-scoped значения workflow
передаёт только на время поставки. Локальный SSH alias не заменяет эти источники.
Перед добавлением переменной, секрета, alias или Compose project оператор сверяет
workflow, `runtime.env` и `deploy.sh`; последний задаёт единственный root проекта
`/srv/expressa/<environment>` и имя `expressa-<environment>`.

## Публичные тестовые доступы

| Среда | Роль | Телефон | OTP | Источник конфигурации |
| --- | --- | --- | --- | --- |
| development | customer | `+79990000001` | `000000` | GitHub Environment `development`: `AUTH_DEVELOPMENT_OTP` |
| development | administrator | `+79990000002` | `000000` | GitHub Environment `development`: `BOOTSTRAP_ADMIN_PHONE`, `AUTH_DEVELOPMENT_OTP` |
| staging | customer | `+79990000001` | `000000` | фиксированный контракт `staging_test` |
| staging | administrator | `+79990000002` | `000000` | GitHub Environment `staging`: `BOOTSTRAP_ADMIN_PHONE`; фиксированный контракт `staging_test` |

`BOOTSTRAP_ADMIN_PHONE` в GitHub Environments `development` и `staging`
создаёт или обновляет administrator при каждом seed. В staging OTP выдаётся
только двум номерам таблицы; другие номера не входят в allowlist. Полный
порядок ротации и проверки приведён в [операционном запуске](Operations-runbook.md).

`operations-verification.yml` запускается из `main` по cron `0 2 * * *` или
ручному dispatch с `confirm_operations_verification=true`; concurrency сохраняет
один активный запуск. Он использует Environment `development`, не выполняет
поставку, проверяет host backup, isolated restore с public-menu smoke и delivery
Alertmanager, затем сохраняет санитизированный artifact. Фактические RPO/RTO,
имя копии и acknowledgement receiver считаются evidence только из успешного
artifact этого workflow. [Operations verification](../../.github/workflows/operations-verification.yml).
