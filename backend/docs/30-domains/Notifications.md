---
title: "Push-привязки"
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../src/notifications/transport/push-subscriptions.controller.ts
  - ../../openapi/openapi.json
knowledge_role: implementation
scope: backend
---

# Push-привязки

Текущий v2 push API содержит public key, inspect и версионируемую association через `PUT` / `DELETE`. Прямые маршруты записи / удаления subscription отсутствуют. Владельцы: [controller](../../src/notifications/transport/push-subscriptions.controller.ts) и [OpenAPI](../../openapi/openapi.json).

Семантика привязки и удаления при logout принадлежит [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Эта серверная граница не подтверждает доставку push в браузер; общий вход — [push-контракт](../../../docs/50-interfaces/Push-notifications.md).
