---
title: Notifications
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../src/notifications/transport/push-subscriptions.controller.ts
  - ../../openapi/openapi.json
---

# Notifications

Текущие v2 push API: public key, inspect и versioned association `PUT`/`DELETE`. Прямые subscription routes удалены. Logout association semantics принадлежат [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).
