---
title: Выпуск и совместимость версий
type: operations
owner: root
last_verified: 2026-09-09
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
  - ../../.github/workflows/production-promotion.yml
  - ../../deploy/staging.env
---

# Выпуск и совместимость версий

Единица поставки — три immutable image digest: backend, front-office и
back-office. Development формирует набор для SHA main; staging принимает набор
из `deploy/staging.env` по тегу `staging-v*` без пересборки. [Development](../../.github/workflows/development-delivery.yml),
[staging](../../.github/workflows/staging-deploy.yml), [manifest](../../deploy/staging.env).

`staging-v0.2.10` — аннотированный составной тег поставки на SHA
`de01cc3f4ed29cd61525b3ed96defd476c2d74c1`. Его manifest получен из
успешного Development run `31928967912` для SHA
`fc365d8c8652bc3e2a8bbc3b8eb51ff3427bcbb8` (SHA256
`0b58c33860aec1108d16e4ae3ca154d9142fe0d517e0eeca1e178d5241c3c6dc`).
Staging run `31929440771` успешно проверил этот набор: миграции,
идемпотентный seed, health трёх приложений, public menu и полный сценарий
заказа. Это не выпуск отдельного компонента: в образах остаются версии пакетов
backend `v0.2.0`, front-office `v0.1.0` и back-office `v0.1.0`.

Совместимость приложения определяется проверенным набором CI и HTTP/OpenAPI
контрактом, а не отдельной политикой версий API. Production вручную принимает только `staging-v*` с успешной staging-приёмкой и использует ровно его manifest из трёх digest; rebuild, `latest` и произвольный manifest не являются путём поставки. [Production workflow](../../.github/workflows/production-promotion.yml), [CI/CD](CI-CD.md), [контракты](../20-architecture/Cross-repository-contracts.md).

## Решение о версии и выпуске

Для каждого состояния поставки автор фиксирует в назначении или evidence:
применимый проектный источник, среду, является ли изменение consumer-facing
release, и для component semantic versions, human changelog и tag — `required`
или `not required` с причиной. Это решение проверяется до закрытия поставки;
оно не создаёт автоматический bump, changelog или tag.

Development поставляется по SHA и digest. Этот маршрут не отменяет записи
решения: если это не consumer-facing release, semantic versions, changelog и
release tag могут быть `not required` с указанием SHA/digest-маршрута и причины.
До закрытия consumer-facing release его явно классифицируют, затем применяют
подходящие Semantic Versioning, changelog и tag из применимых Git/release-норм.

Staging принимает только существующий immutable manifest, привязанный к
`staging-v*`, без rebuild; production продвигает ровно принятый manifest этого
тега. Поэтому эти среды не создают произвольный новый component bump, changelog
или tag: запись решения указывает, используется ли уже существующий
`staging-v*`, требуется ли новый составной тег для выбранного manifest и почему
остальные пункты required либо not required.
