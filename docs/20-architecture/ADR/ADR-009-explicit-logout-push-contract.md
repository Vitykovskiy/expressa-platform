---
title: явный logout и push-контракт
type: adr
status: accepted
owner: root
date: 2026-09-20
last_verified: 2026-09-20
sources:
  - ../../../backend/openapi/openapi.json
  - ../../../backend/src/auth/transport/auth.controller.ts
  - ../../../backend/src/auth/application/logout.use-case.ts
  - ../../../backend/src/auth/adapters/postgres-auth.repository.ts
  - ../../../backend/src/notifications/transport/push-subscriptions.controller.ts
---

# ADR-009: явный logout и push-контракт

`POST /api/v2/auth/logout` всегда требует exact JSON object `{ "pushSubscription": null | { "endpoint", "keys": { "p256dh", "auth" } } }`. Отсутствующее body/поле, лишние поля, пустые keys или endpoint не HTTPS дают `400 VALIDATION_ERROR`. `null` означает session-only logout.

С object payload logout выполняется одной PostgreSQL transaction. При active session с точным session id/hash удаляются только association этого user с точными endpoint+p256dh+auth и сессия отзывается. Exact replay того же session id/hash после отзыва также возвращает `204` и повторяет точное удаление association. При missing, malformed, expired или mismatched credential object служит capability-only proof: удаляется только точная association независимо от owner; неизвестная server session не отзывается и owner не раскрывается. Это не `401` ветка.

`null` использует только server-session logout. Invalid credential не даёт утверждать server-side revocation; controller всё равно очищает cookie и возвращает `204`. Любая storage/transaction failure откатывает изменения, возвращает `503 SERVICE_UNAVAILABLE` и не очищает cookie. Cookie очищается только после успешного `204`. Browser permission и local PushSubscription не меняются.

Оставлены только `GET /api/v2/push/public-key`, `POST /api/v2/push/subscriptions/inspect`, `PUT` и `DELETE` `/api/v2/push/subscriptions/association`. Прямые `PUT`/`DELETE /api/v2/push/subscriptions` удалены. ADR-005 superseded этой записью; его историческая мотивация не задаёт текущий API.
