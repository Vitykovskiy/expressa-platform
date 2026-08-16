---
title: Выпуск и совместимость версий
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../.github/workflows/staging-deploy.yml
  - ../../.github/workflows/production-promotion.yml
  - ../../deploy/staging.env
---

# Выпуск и совместимость версий

Единица поставки — три immutable image digest: backend, front-office и
back-office. Development формирует набор для SHA main; staging принимает набор
из `deploy/staging.env` по тегу `staging-v*` без пересборки. [Development](../../.github/workflows/development-delivery.yml),
[staging](../../.github/workflows/staging-deploy.yml), [manifest](../../deploy/staging.env).

Подготовленный manifest для следующего тега `staging-v0.2.10` получен из
успешного Development run `31928967912` для SHA
`fc365d8c8652bc3e2a8bbc3b8eb51ff3427bcbb8`. Это составной тег поставки
набора, а не выпуск отдельного компонента: в его образах остаются версии
пакетов backend `v0.2.0`, front-office `v0.1.0` и back-office `v0.1.0`.

Совместимость приложения определяется проверенным набором CI и HTTP/OpenAPI
контрактом, а не отдельной политикой версий API. Production вручную принимает только `staging-v*` с успешной staging-приёмкой и использует ровно его manifest из трёх digest; rebuild, `latest` и произвольный manifest не являются путём поставки. [Production workflow](../../.github/workflows/production-promotion.yml), [CI/CD](CI-CD.md), [контракты](../20-architecture/Cross-repository-contracts.md).
