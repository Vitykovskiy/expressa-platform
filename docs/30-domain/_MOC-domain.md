---
type: moc
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
---

# Доменные контракты

Корневые ноты фиксируют межконтурную семантику; runtime-детали находятся в
локальных docs. [Источник: OpenAPI](../../backend/openapi/openapi.json).

- [Аудит](Audit.md), [идентификация и доступ](Identity-and-access.md).
- [Каталог и меню](Catalog-and-menu.md), [конфигурация товара](Product-configuration.md), [доступность](Availability.md).
- [Доменная модель](Domain-model.md), [цены](Pricing.md).
- [Жизненный цикл](Order-lifecycle.md), [снимки](Order-snapshots.md).

Только создание заказа имеет current server contract; очередь, переходы стадий и
управление доступностью не выводятся из этого MOC как активные сценарии.
[Источник: OpenAPI](../../backend/openapi/openapi.json).
