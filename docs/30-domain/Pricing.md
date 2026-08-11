---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
---
# Цены

Backend пересчитывает конфигурацию по актуальному каталогу в minor units.
`expectedTotalMinor` — optimistic check: расхождение возвращает
`ORDER_TOTAL_CHANGED` с новым total без заказа; недоступность возвращает
`MENU_ITEM_UNAVAILABLE`. [Источники: revalidation](../../backend/src/orders/domain/order-revalidation.ts), [E2E](../../backend/test/e2e/create-order.e2e-spec.ts).
