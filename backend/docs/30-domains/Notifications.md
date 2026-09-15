---
title: Уведомления customer
type: feature
owner: backend
implementation_status: target-partial
last_verified: 2026-09-14
sources:
  - ../../src/notifications/adapters/postgres-push-subscription.repository.ts
  - ../../src/auth/application/logout.use-case.ts
  - ../../../docs/20-architecture/ADR/ADR-005-customer-notification-association.md
---

# Уведомления customer

Текущий backend хранит browser push capabilities и связывает каждую не более
чем с одним customer; один customer может иметь несколько capabilities.
Заказы выбирают адресатов после core transaction, а invalid delivery очищает
точный устаревший снимок.

## Accepted target: detach on logout

Расширенный POST /api/v2/auth/logout принимает необязательное
pushSubscription. Объект имеет только непустой absolute HTTPS endpoint и keys с
непустыми string p256dh/auth. expirationTime отсутствует; неизвестные поля
request/object/keys отклоняются как 400 VALIDATION_ERROR. С объектом auth
repository в одной PostgreSQL transaction:

1. блокирует и проверяет refresh-session по id/hash;
2. получает user_id;
3. удаляет только строку, где совпали user_id, endpoint, p256dh и auth;
4. отзывает session и commit.

Отсутствующая строка или иной owner дают тот же успешный результат без
раскрытия. Другие capabilities customer не меняются. null/отсутствующее поле
отзывают только session. Validation не начинает transaction; storage error
откатывает оба эффекта. Для той же session id/hash разрешён идемпотентный replay
после потерянного ответа; другой hash не принимается как session-proof.
Object-body с missing/malformed/expired/mismatched credential выполняет
capability-only удаление точной endpoint + p256dh + auth association независимо
от owner, не раскрывает её и даёт 204 с очисткой cookie. Session storage failure
даёт 503 без очистки. Exact replay даёт 204. null и omitted сохраняют legacy
204+clear для invalid credential. null/omitted 204 гарантирует только caller
session logout и не меняет association; object 204 дополнительно гарантирует
отсутствие точной association. Отзыв server session заявляется только для
active-session/exact-replay. Ни одна ветка не вызывает local unsubscribe.

Logout не управляет browser permission и не вызывает local unsubscribe.
Новые выборки адресатов после commit не включают отвязанную строку; уже
переданное provider сообщение не отзывается. После нового login association
создаётся лишь явным enable. Runtime ещё не реализует эту logout transaction.
[ADR](../../../docs/20-architecture/ADR/ADR-005-customer-notification-association.md).
