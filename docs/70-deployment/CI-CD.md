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

GitHub SSH-переменные остаются входами runner для соединения с VPS и не
передаются на сервер. SCP копирует во временный VPS-каталог только `deploy.sh`,
`compose.yml` и image manifest; stdin SSH передаёт только `BOOTSTRAP_ADMIN_PHONE`.
`deploy.sh` читает runtime-секреты и конфигурацию из заранее созданного
`/srv/expressa/<environment>/runtime.env`. Этот файл содержит
`POSTGRES_PASSWORD`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_OTP_PEPPER`,
`CORS_ORIGINS` и OTP-настройку: development `AUTH_DEVELOPMENT_OTP`, staging
`SMS_RU_API_ID`/`SMS_RU_SENDER`. Значения не печатаются и не входят в GitHub
workflow. [Development deploy step](../../.github/workflows/development-delivery.yml),
[staging deploy step](../../.github/workflows/staging-deploy.yml),
[remote transfer](../../deploy/run-remote.sh), [проверка ключей](../../deploy/deploy.sh).
