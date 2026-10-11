---
title: "Межконтурные контракты"
type: contract
owner: root
last_verified: 2026-10-10
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/package.json
knowledge_role: requirements
scope: system
---

# Межконтурные контракты

Backend публикует версионированный HTTP API; front-office и back-office
потребляют его через свои API-клиенты и OpenAPI-снимки. Прямые исходные импорты
между тремя приложениями запрещены. [OpenAPI](../../backend/openapi/openapi.json),
[синхронизация снимков](../../backend/package.json).

Изменение HTTP-контракта требует обновить backend OpenAPI и клиентские проверки;
`openapi:sync` копирует опубликованный документ в оба клиентских контура.
[Команда](../../backend/package.json), [front contract check](../../front-office/package.json),
[back-office manifest](../../back-office/package.json). Наличие обязательной проверки
back-office не предполагается: её команды берутся из фактической конфигурации
выбранного клиента.

Клиентские опубликованные копии:
[front-office/contracts/openapi.json](../../front-office/contracts/openapi.json) и
[back-office/contracts/openapi.json](../../back-office/contracts/openapi.json).
Они содержат точные сериализованные байты текущей backend-публикации;
staff-снимок — новый контрактный артефакт, без импорта или восстановления прежних
исходников. Его локальный владелец описан в
[staff slice](../../back-office/docs/10-architecture/staff-read-slice.md#http-снимок).
Существующий `front-office` `contract:check` сравнивает байты с backend;
у `back-office` такой команды сейчас нет. Снимок не является runtime-клиентом
или доказательством авторизации: custom role policy проверяется guard, её
текстовое описание в операции не задаёт машиночитаемое правило доступа.

Предметная ownership остаётся локальной: auth/catalog/orders — backend,
customer UI — front-office, staff UI — back-office. [Backend](../../backend/docs/INDEX.md),
[front-office](../../front-office/docs/INDEX.md), [back-office](../../back-office/docs/INDEX.md).
