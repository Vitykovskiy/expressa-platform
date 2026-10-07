---
title: "Вход и безопасный returnTo"
type: feature
owner: front-office
last_verified: 2026-10-07
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/auth.api.ts
  - ../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
knowledge_role: implementation
scope: front-office
---

# Вход и безопасный returnTo

Клиент использует текущие v2 OTP, refresh, `me` и logout с обязательным body. Методы и статусы находятся в [auth API](../../src/shared/api/auth.api.ts), переходы — в [router](../../src/app/router.ts).

Guard допускает в защищённые историю и детали только customer-путь и возвращает к входу с внутренним `returnTo`. Правила безопасного возврата принадлежат [auth-return](../../src/shared/lib/auth-return.ts).

Logout отправляет `pushSubscription: null | object`. Точная серверная семантика и требования к чтению локальной подписки находятся в [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md); эта нота не копирует транзакционный протокол.
