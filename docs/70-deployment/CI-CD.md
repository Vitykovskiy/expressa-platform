---
title: CI и поставка
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
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
[staging](../../.github/workflows/staging-deploy.yml).

После staging-поставки workflow проверяет публичные health-маршруты. URL
поступают только из секретов `STAGING_BACKEND_URL`, `STAGING_FRONT_OFFICE_URL`
и `STAGING_BACK_OFFICE_URL`: backend проверяется по `/health/live` и
`/health/ready`, каждый клиент — по `/health`. `curl` не выводит тело или URL;
журнал содержит только маркеры успешных проверок `backend_live_passed`,
`backend_ready_passed`, `front_office_health_passed` и
`back_office_health_passed`.

GitHub SSH-переменные остаются входами runner для соединения с VPS и не
передаются на сервер. SCP копирует во временный VPS-каталог только `deploy.sh`,
`compose.yml`, `smoke-staging.mjs` и image manifest. Для staging stdin SSH передаёт
`BOOTSTRAP_ADMIN_PHONE`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_OTP_PEPPER` и
`CORS_ORIGINS`; remote script передаёт их `deploy.sh`, не записывая в
`runtime.env`. `deploy.sh` читает из этого заранее созданного файла пароль
PostgreSQL, а для development — `AUTH_DEVELOPMENT_OTP`. В staging он включает
`AUTH_OTP_MODE=staging_test`, фиксированный OTP и точный allowlist из
`BOOTSTRAP_ADMIN_PHONE` и синтетического customer `+79990000001`. Значения не
печатаются и не входят в GitHub workflow. [Development deploy step](../../.github/workflows/development-delivery.yml),
[staging deploy step](../../.github/workflows/staging-deploy.yml),
[remote transfer](../../deploy/run-remote.sh), [проверка ключей](../../deploy/deploy.sh).
