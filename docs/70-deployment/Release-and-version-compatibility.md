---
title: Выпуск и совместимость версий
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../.github/workflows/staging-deploy.yml
  - ../../deploy/staging.env
---

# Выпуск и совместимость версий

Единица поставки — три immutable image digest: backend, front-office и
back-office. Development формирует набор для SHA main; staging принимает набор
из `deploy/staging.env` по тегу `staging-v*` без пересборки. [Development](../../.github/workflows/development-delivery.yml),
[staging](../../.github/workflows/staging-deploy.yml), [manifest](../../deploy/staging.env).

`staging-v0.2.8` — составной тег поставки набора, а не выпуск отдельного
компонента: в его образах остаются версии пакетов backend `v0.2.0`, front-office
`v0.1.0` и back-office `v0.1.0`. Планируемый `staging-v0.2.9` повторно поставит
те же digest для сбора доказательств; он также не меняет версии компонентов.

Совместимость приложения определяется проверенным набором CI и HTTP/OpenAPI
контрактом, а не отдельной политикой версий API. Правила production-выпуска отсутствуют.
[CI/CD](CI-CD.md), [контракты](../20-architecture/Cross-repository-contracts.md).
