---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
---
# Цены

Backend пересчитывает конфигурацию по актуальному каталогу в целых рублях.
Денежные поля во всех слоях — неотрицательные целые числа: цена `320 ₽`
хранится, передаётся и отображается как `320`; дробные значения, копейки и
пересчёт между единицами отсутствуют. `expectedTotal` — проверка ожидаемого
итога: расхождение возвращает `ORDER_TOTAL_CHANGED` с новым `total` без
создания заказа; недоступность возвращает `MENU_ITEM_UNAVAILABLE`.
[Источники: revalidation](../../backend/src/orders/domain/order-revalidation.ts), [OpenAPI](../../backend/openapi/openapi.json), [E2E](../../backend/test/e2e/create-order.e2e-spec.ts).
