# E07 — Корзина и создание заказа

[К backlog](../INDEX.md).

Статус: complete.

Эпик завершён в границах создания заказа: backend атомарно проверяет и сохраняет
заказ со снимками, а front-office сохраняет корзину, проводит customer через OTP
и показывает результат `POST /api/v1/orders`. Чтение заказа, история, стадии,
оплата и push-уведомления относятся к следующим эпикам.

## [backend](backend/INDEX.md)

- [BL-0098.md](backend/BL-0098.md)
- [BL-0099.md](backend/BL-0099.md)
- [BL-0100.md](backend/BL-0100.md)
- [BL-0101.md](backend/BL-0101.md)
- [BL-0102.md](backend/BL-0102.md)

## [front-office](front-office/INDEX.md)

- [BL-0103.md](front-office/BL-0103.md)
- [BL-0104.md](front-office/BL-0104.md)
- [BL-0105.md](front-office/BL-0105.md)
- [BL-0106.md](front-office/BL-0106.md)
- [BL-0107.md](front-office/BL-0107.md)
- [BL-0108.md](front-office/BL-0108.md)
- [BL-0109.md](front-office/BL-0109.md)

## quality

- [BL-0110.md](quality/BL-0110.md)

## Доказательства

- [Миграция заказов](../../../../backend/migrations/0006_e07_orders.sql),
  [HTTP E2E](../../../../backend/test/e2e/create-order.e2e-spec.ts) и
  [интеграция транзакции](../../../../backend/test/integration/order-unit-of-work.integration.spec.ts).
- [Browser checkout E2E](../../../../front-office/tests/e2e/checkout.e2e.spec.ts)
  и [front-office CI](../../../../.github/workflows/front-office-ci.yml).
- [OpenAPI](../../../../backend/openapi/openapi.json) содержит только реализованный
  в E07 `POST /api/v1/orders`.
