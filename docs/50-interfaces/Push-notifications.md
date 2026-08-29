---
title: Push-уведомления
type: interface
owner: root
last_verified: 2026-08-16
sources:
  - ../../backend/src/notifications/notifications.module.ts
  - ../../front-office/src/app/push-notifications.ts
---

# Push-уведомления

Backend публикует public VAPID key и customer-only upsert/delete подписки через
`/api/v2/push/*`. Новый заказ уведомляет staff; переходы `ACCEPTED`, `READY` и
`ISSUED` уведомляют customer после core transaction. Ошибка доставки не
откатывает заказ, а недействительная подписка удаляется.
[Notifications module](../../backend/src/notifications/notifications.module.ts),
[OpenAPI](../../backend/openapi/openapi.json).

Front-office запрашивает permission только по явному действию customer,
сохраняет подписку через API и открывает заказ по click уведомления.
[Push handler](../../front-office/src/app/push-notifications.ts),
[страница заказа](../../front-office/src/pages/OrderPage.vue).
