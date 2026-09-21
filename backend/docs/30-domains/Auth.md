---
title: Auth
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../src/auth/transport/auth.controller.ts
  - ../../src/auth/application/logout.use-case.ts
  - ../../src/auth/adapters/postgres-auth.repository.ts
---

# Auth

Текущие auth routes — v2 OTP request/verify, refresh, required-body logout и `me`; точный HTTP contract в [OpenAPI](../../openapi/openapi.json). Logout принимает только exact body с `pushSubscription: null | object`. Object даёт active-session либо capability-only transaction; exact replay возвращает `204`. Storage failure даёт `503` без очистки cookie. [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md) фиксирует границу.
