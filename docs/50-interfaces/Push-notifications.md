---
title: "Push-уведомления и привязки"
type: interface
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/notifications/transport/push-subscriptions.controller.ts
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
knowledge_role: implementation
scope: system
---

# Push-уведомления и привязки

Текущие маршруты: `GET /api/v2/push/public-key`, `POST /api/v2/push/subscriptions/inspect`, `PUT /api/v2/push/subscriptions/association`, `DELETE /api/v2/push/subscriptions/association`. Точные схемы и роли — [OpenAPI](../../backend/openapi/openapi.json), реализация — [controller](../../backend/src/notifications/transport/push-subscriptions.controller.ts).

Прямых маршрутов записи / удаления subscription нет. Logout, проверка подписки без действующей сессии, повтор запроса, транзакции и ошибки cookie описаны в [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).

Разрешение браузера, локальная подписка, серверная association и доставка уведомления — разные состояния. Наличие API привязки не является доказательством доставки push.
