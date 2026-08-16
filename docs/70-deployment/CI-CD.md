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
для compose и удаляет `DELIVERY_VAPID_*` из окружения. `deploy.sh` читает из
этого заранее созданного файла пароль PostgreSQL, а для development —
`AUTH_DEVELOPMENT_OTP`. В staging он включает
`AUTH_OTP_MODE=staging_test`, фиксированный OTP и точный allowlist из
`BOOTSTRAP_ADMIN_PHONE` и синтетического customer `+79990000001`. Значения
хранятся в GitHub Environment Secrets, не коммитятся в YAML, не печатаются и
не сохраняются в `runtime.env` или временном каталоге VPS. [Development deploy step](../../.github/workflows/development-delivery.yml),
[staging deploy step](../../.github/workflows/staging-deploy.yml),
[remote transfer](../../deploy/run-remote.sh), [проверка ключей](../../deploy/deploy.sh).

Отдельный ручной `operations-verification.yml` принимает только dispatch из
`main` с `confirm_operations_verification=true`, использует Environment
`development` и не выполняет поставку. Он запускает host backup, isolated
restore с public-menu smoke и изолированную проверку delivery Alertmanager,
затем сохраняет санитизированный artifact. Фактические RPO/RTO, имя копии и
acknowledgement receiver считаются evidence только из успешного artifact этого
workflow. [Operations verification](../../.github/workflows/operations-verification.yml).
