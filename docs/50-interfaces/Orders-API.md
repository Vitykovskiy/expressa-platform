---
type: interface
owner: root
last_verified: 2026-08-16
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/orders/transport/orders.controller.ts
---
# API заказов

Customer использует `POST /api/v1/orders`, `GET /api/v1/orders` и
`GET /api/v1/orders/{orderId}`. Создание требует Bearer и UUID
`Idempotency-Key`; список использует opaque cursor и возвращает только заказы
текущего customer, а деталь скрывает staff events. Тело создания содержит expected
total и непустые item с товаром, nullable variant, modifier ids и quantity;
`201` возвращает `CREATED` snapshot.
[Источники: OpenAPI](../../backend/openapi/openapi.json), [controller](../../backend/src/orders/transport/orders.controller.ts).

Fingerprint канонизирует порядок item и modifier ids: эквивалентное тело в ином
порядке повторяет заказ; только другой canonical fingerprint даёт
`IDEMPOTENCY_KEY_REUSED`. total/item/intake errors не создают заказ.
[Источники: fingerprint](../../backend/src/orders/domain/order-fingerprint.ts), [spec](../../backend/src/orders/domain/order-fingerprint.spec.ts), [unit of work](../../backend/src/orders/adapters/postgres-order-unit-of-work.ts).
