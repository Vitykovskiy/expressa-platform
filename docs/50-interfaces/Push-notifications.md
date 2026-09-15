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
Текущий logout не меняет permission, подписку или association. Это наблюдаемое
legacy-поведение и оно не соответствует принятому целевому контракту ниже.

Добавочные `inspect`, explicit `enable`/`transfer` и versioned owner-stop
методы описаны по
[ADR-005](../20-architecture/ADR/ADR-005-customer-notification-association.md).
Inspect не меняет сервер, не возвращает чужую личность и не утверждает, что
только локальная подписка включена для текущего аккаунта. Перенос требует
авторизованного customer, явного действия и доказательства контроля текущей
подписки; старые методы сохраняют совместимость и не выполняют перенос.

Локальная остановка доступна без входа только для текущего браузера. Серверная
очистка invalid delivery остаётся изолированной от перехода заказа. Уже
переданное провайдеру сообщение не отзывается. API inspect/association
реализован, но атомарная отвязка в logout ещё не реализована; customer policy принадлежит
[feature contract](../40-features/Track-history-and-repeat-order.md).

## Accepted target: current-browser logout

Новый customer front-office вызывает POST /api/v2/auth/logout с
pushSubscription: PushSubscription | null. Объект содержит только непустой
absolute HTTPS endpoint и непустые keys.p256dh/keys.auth; expirationTime не
входит в wire contract. Неизвестные поля request/object/keys отклоняются как
400 VALIDATION_ERROR. null означает подтверждённое отсутствие локальной
capability или Push API. Отсутствующее поле сохраняет session-only поведение
старых клиентов.

Backend в одной transaction проверяет refresh-сессию, удаляет только совпавшую
по user_id + endpoint + p256dh + auth связь и отзывает эту сессию. Для object
payload 204 подтверждает caller session logout и отсутствие точной association;
server-session revocation подтверждается только active/exact-replay веткой.
Для null/omitted 204 подтверждает только legacy session logout и не меняет
association. Validation error не начинает transaction, storage
error откатывает применимые эффекты и не очищает cookie. Отсутствующая либо чужая
строка не раскрывается и считается отвязанной от выходящего customer. Повтор
того же запроса с той же session id/hash после потери ответа идемпотентен.
Object-body без действительной session использует capability-only transaction:
удаляет лишь точную endpoint + keys association независимо от owner, не
раскрывает её и возвращает 204 с очисткой cookie. Storage failure — 503 без
очистки. Legacy null/omitted invalid credential остаётся 204.

Закрытие/background PWA ничего не меняют. Ни одна logout-ветка не вызывает
browser unsubscribe(), не отзывает permission и не затрагивает другие браузеры;
удаляется только точная backend association.
После нового входа association создаётся только по явному «Включить
уведомления». Полные rationale и failure semantics задаёт [ADR-005](../20-architecture/ADR/ADR-005-customer-notification-association.md).
