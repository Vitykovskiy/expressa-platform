---
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/platform/observability/unified-exception.filter.ts
  - ../../backend/test/e2e/create-order.e2e-spec.ts
---

# Модель ошибок и идемпотентность

HTTP-ошибка имеет `code`, `message`, `details`, `requestId`; filter приводит
исключения к этому формату. Front-office API client сохраняет requestId в
`ApiError`; отображение зависит от вызывающего экрана.
[Источники: filter](../../backend/src/platform/observability/unified-exception.filter.ts), [front client](../../front-office/src/shared/api/client.ts).

`POST /api/v2/orders` требует `Idempotency-Key` в границе customer: одинаковый
ключ и тело возвращают сохранённый заказ, другой body с ключом даёт conflict,
а разные customer могут использовать один ключ. Пересчёт суммы и недоступная
позиция заказа не создают. [Источники: unit of work](../../backend/src/orders/adapters/postgres-order-unit-of-work.ts), [multi-customer E2E](../../backend/test/e2e/create-order.e2e-spec.ts), [OpenAPI](../../backend/openapi/openapi.json).
