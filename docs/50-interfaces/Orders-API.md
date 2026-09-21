---
type: interface
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/orders/transport/orders-v3.controller.ts
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
---

# API заказов

Customer order API существует только под v3: `GET /api/v3/orders`, `GET /api/v3/orders/{orderId}`, `POST /api/v3/orders` и `POST /api/v3/orders/{orderId}/repeat`. Создание требует Bearer и `Idempotency-Key`; точные request/response schemas принадлежат [OpenAPI](../../backend/openapi/openapi.json). Позиция использует `productId`, nullable `priceChoiceId`, nullable `portionLabel`, modifier ids и quantity; variant/S-M-L модели нет.

Staff list/detail существуют только как `GET /api/v3/backoffice/orders` и `GET /api/v3/backoffice/orders/{orderId}`. Lifecycle commands остаются текущими v2 routes. Удалённых v2 customer/staff read и customer command routes нет.
