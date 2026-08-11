---
type: feature
owner: root
implementation_status: unsupported
last_verified: 2026-08-11
sources:
  - ../../back-office/src/app/router.ts
---
# Приготовление и выдача заказа

## 6.3. Приготовление и выдача

Приготовление, очередь, смена стадии, оплата и выдача не являются активным
runtime-сценарием: `/queue` подключает placeholder `QueuePage`, а
`OrdersScreen` не имеет routed consumer; backend контракт публикует только
создание заказа. [Источники: router](../../back-office/src/app/router.constants.ts), [QueuePage](../../back-office/src/pages/QueuePage.vue), [OrdersScreen](../../back-office/src/pages/admin/orders/OrdersScreen.vue), [OpenAPI](../../backend/openapi/openapi.json).
