---
title: Межконтурные контракты
type: contract
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/package.json
---

# Межконтурные контракты

Backend публикует версионированный HTTP API; front-office и back-office
потребляют его через свои API-клиенты и OpenAPI-снимки. Прямые исходные импорты
между тремя приложениями запрещены. [OpenAPI](../../backend/openapi/openapi.json),
[синхронизация снимков](../../backend/package.json).

Изменение HTTP-контракта требует обновить backend OpenAPI и клиентские проверки;
`openapi:sync` копирует опубликованный документ в оба клиентских контура.
[Команда](../../backend/package.json), [front contract check](../../front-office/package.json),
[back contract check](../../back-office/package.json).

Предметная ownership остаётся локальной: auth/catalog/orders — backend,
customer UI — front-office, staff UI — back-office. [Backend](../../backend/docs/INDEX.md),
[front-office](../../front-office/docs/INDEX.md), [back-office](../../back-office/docs/INDEX.md).
