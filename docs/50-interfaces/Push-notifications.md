---
title: Push-уведомления
type: interface
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/notifications/transport/push-subscriptions.controller.ts
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
---

# Push-уведомления

Текущие push routes: `GET /api/v2/push/public-key`, `POST /api/v2/push/subscriptions/inspect`, `PUT /api/v2/push/subscriptions/association`, `DELETE /api/v2/push/subscriptions/association`. Exact schemas и roles задаёт [OpenAPI](../../backend/openapi/openapi.json). Прямых subscription PUT/DELETE routes нет.

Logout contract, capability-only fallback, exact replay, transaction и cookie failure semantics — [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Browser permission и local subscription не являются server association.
