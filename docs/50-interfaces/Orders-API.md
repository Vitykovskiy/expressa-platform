---
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/orders/transport/orders.controller.ts
---
# API заказов

Единственный orders endpoint — `POST /api/v1/orders` для customer с Bearer и
UUID `Idempotency-Key`. Тело содержит expected total и непустые item с товаром,
nullable variant, modifier ids и quantity; `201` возвращает `CREATED` snapshot.
[Источники: OpenAPI](../../backend/openapi/openapi.json), [controller](../../backend/src/orders/transport/orders.controller.ts).

Fingerprint канонизирует порядок item и modifier ids: эквивалентное тело в ином
порядке повторяет заказ; только другой canonical fingerprint даёт
`IDEMPOTENCY_KEY_REUSED`. total/item/intake errors не создают заказ.
[Источники: fingerprint](../../backend/src/orders/domain/order-fingerprint.ts), [spec](../../backend/src/orders/domain/order-fingerprint.spec.ts), [unit of work](../../backend/src/orders/adapters/postgres-order-unit-of-work.ts).
