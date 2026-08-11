---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/application/order-unit-of-work.types.ts
---
# Жизненный цикл заказа

## 9. Модель состояний заказа

### 8.5. Оплата при получении

Реализованная стадия заказа — только `CREATED`, назначаемая при `POST /api/v1/orders`.
Очередь, переходы `ACCEPTED/PREPARING/READY/ISSUED`, оплата и выдача не входят
в текущий runtime-контракт. [Источник: order types](../../backend/src/orders/application/order-unit-of-work.types.ts), [OpenAPI](../../backend/openapi/openapi.json).

Создание требует customer и ключ идемпотентности; подробности запроса —
[Orders API](../50-interfaces/Orders-API.md).
