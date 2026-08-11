---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/adapters/postgres-order-unit-of-work.ts
---
# Снимки заказа

Создание сохраняет заказ, позиции и выбранные добавки как snapshot: исходные id,
названия, вариант/размер, количество и unit/line total. Поэтому ответ создания
не зависит от последующей правки каталога. [Источники: unit of work](../../backend/src/orders/adapters/postgres-order-unit-of-work.ts), [E2E](../../backend/test/e2e/create-order.e2e-spec.ts).
