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
контракты; код, миграции и OpenAPI остаются источниками истины. [Сборка модулей](../src/app.module.ts).

## Карты

- [Реестр покрытия](COVERAGE.md) — маршруты, объекты runtime и статус всех нот.
- [Архитектура](10-architecture/_MOC-architecture.md) — контроллеры, сценарии,
  порты и адаптеры.
- [ADR-001](10-architecture/ADR/ADR-001-layered-modules.md) — слоистая организация модулей.
- [Предметные области](30-domains/_MOC-domains.md) — авторизация, каталог,
  заказы и `/me`.
- [Данные](40-data/_MOC-data.md), [HTTP API](50-api/_MOC-api.md),
  [операции](60-operations/_MOC-operations.md), [тестирование](95-testing/_MOC-testing.md).
- [Источники](./_sources/README.md), [правила обновления](00-meta/_MOC-meta.md)
  и [журнал](./_journal/2026-08-11-backend-vault.md).
