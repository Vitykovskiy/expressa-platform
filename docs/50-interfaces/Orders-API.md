---
title: "API заказов"
type: interface
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/orders/transport/orders-v3.controller.ts
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
knowledge_role: implementation
scope: system
---

# API заказов

## Покупатель

Текущие операции: `GET /api/v3/orders`, `GET /api/v3/orders/{orderId}`, `POST /api/v3/orders`, `POST /api/v3/orders/{orderId}/repeat`. Создание требует Bearer и `Idempotency-Key`. Точные тела, статусы и схемы принадлежат [OpenAPI](../../backend/openapi/openapi.json), реализация — [controller](../../backend/src/orders/transport/orders-v3.controller.ts).

Не переносите поля снимка в запрос создания: запрос, ответ и сохранённая позиция — разные схемы. Правила суммы и повторов — [ошибки / идемпотентность](Error-model-and-idempotency.md), данные истории — [снимки](../30-domain/Order-snapshots.md).

## Сотрудник

Очередь и детали читаются через `GET /api/v3/backoffice/orders` и `GET /api/v3/backoffice/orders/{orderId}`. Команды стадий остаются текущими v2 операциями. Владельцы — [staff API](Back-office-API.md) и [жизненный цикл](../30-domain/Order-lifecycle.md).

Граница удалённых v2 операций — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md). Использование `/repeat` конкретным UI проверяйте по [сценарию front-office](../../front-office/docs/30-features/Orders.md).
