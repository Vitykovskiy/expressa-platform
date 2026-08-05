# E07 — Корзина и создание заказа

Статус: complete.

Эпик завершён в границах создания заказа: backend атомарно проверяет и сохраняет
заказ со снимками, а front-office сохраняет корзину, проводит customer через OTP
и показывает результат `POST /api/v1/orders`. Чтение заказа, история, стадии,
оплата и push-уведомления относятся к следующим эпикам.

## backend

- [[backend/BL-0098]]
- [[backend/BL-0099]]
- [[backend/BL-0100]]
- [[backend/BL-0101]]
- [[backend/BL-0102]]

## front-office

- [[front-office/BL-0103]]
- [[front-office/BL-0104]]
- [[front-office/BL-0105]]
- [[front-office/BL-0106]]
- [[front-office/BL-0107]]
- [[front-office/BL-0108]]
- [[front-office/BL-0109]]

## quality

- [[quality/BL-0110]]

## Доказательства

- [Миграция заказов](../../../../backend/migrations/0006_e07_orders.sql),
  [HTTP E2E](../../../../backend/test/e2e/create-order.e2e-spec.ts) и
  [интеграция транзакции](../../../../backend/test/integration/order-unit-of-work.integration.spec.ts).
- [Browser checkout E2E](../../../../front-office/tests/e2e/checkout.e2e.spec.ts)
  и [front-office CI](../../../../.github/workflows/front-office-ci.yml).
- [OpenAPI](../../../../backend/openapi/openapi.json) содержит только реализованный
  в E07 `POST /api/v1/orders`.
