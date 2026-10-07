---
title: "Авторизация и сессии"
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../src/auth/transport/auth.controller.ts
  - ../../src/auth/application/logout.use-case.ts
  - ../../src/auth/adapters/postgres-auth.repository.ts
knowledge_role: implementation
scope: backend
---

# Авторизация и сессии

Текущие маршруты авторизации остаются в v2: запрос / проверка OTP, refresh, logout с обязательным body и `me`. Точный HTTP-контракт принадлежит [OpenAPI](../../openapi/openapi.json), карта — [API аутентификации](../../../docs/50-interfaces/Authentication-API.md).

Logout принимает `pushSubscription: null | object`. Транзакционные ветки, повтор запроса и условия очистки cookie описаны в [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Их реализация: [controller](../../src/auth/transport/auth.controller.ts), [use case](../../src/auth/application/logout.use-case.ts), [repository](../../src/auth/adapters/postgres-auth.repository.ts).
