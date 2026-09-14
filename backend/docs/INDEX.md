---
title: Индекс backend Expressa
description: Главная карта серверной документации.
type: moc
owner: backend
last_verified: 2026-08-11
sources:
  - ../src/app.module.ts
---

# Backend Expressa

Это карта NestJS-сервера Expressa. Документы описывают текущие границы и
контракты; код, схема и OpenAPI остаются источниками истины. [Сборка модулей](../src/app.module.ts).

## Текущее устройство

- [Соглашения](80-conventions/INDEX.md) — обязательные правила и проверки backend.
- [Архитектура](10-architecture/INDEX.md) — слои, модули и ADR.
- [Предметные области](30-domains/INDEX.md) — авторизация, каталог и заказы.
- [Данные](40-data/INDEX.md) — PostgreSQL, текущая схема и транзакции.
- [HTTP API](50-api/INDEX.md) — карта маршрутов; главный контракт —
  [OpenAPI](../openapi/openapi.json).
- [Операции](60-operations/INDEX.md) — запуск, окружение и наблюдаемость.
- [Тестирование](95-testing/INDEX.md) — unit, integration и production.

## Навигация и доказательства

- [Реестр покрытия](COVERAGE.md) — связка runtime, нот и проверок.
- [Правила обновления](00-meta/INDEX.md) — порядок работы с документацией.
- [Исходники](../src/app.module.ts), [схема](../schema.sql),
  [инициализатор](../scripts/initialize-database.ts) и [команды](../package.json) —
  первичные источники.
- [Источники](./_sources/README.md) и
  [журнал](./_journal/2026-08-11-backend-vault.md) не описывают текущее
  runtime-поведение.
