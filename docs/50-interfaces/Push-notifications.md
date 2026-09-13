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

## Current

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

## Current association protocol

Permission выдаётся браузером конкретной установке; серверная association
определяет, для какого customer отправлять события на эту подписку. Одна
подписка имеет не более одного получателя, у customer их может быть несколько.
Logout не меняет permission, подписку или association.

Добавочные `inspect`, explicit `enable`/`transfer` и versioned owner-stop
методы описаны по
[ADR-005](../20-architecture/ADR/ADR-005-customer-notification-association.md).
Inspect не меняет сервер, не возвращает чужую личность и не утверждает, что
только локальная подписка включена для текущего аккаунта. Перенос требует
авторизованного customer, явного действия и доказательства контроля текущей
подписки; старые методы сохраняют совместимость и не выполняют перенос.

Локальная остановка доступна без входа только для текущего браузера. Серверная
очистка invalid delivery остаётся изолированной от перехода заказа. Уже
переданное провайдеру сообщение не отзывается. API, migration и доказательства
гонок реализованы; customer policy принадлежит
[feature contract](../40-features/Track-history-and-repeat-order.md).
