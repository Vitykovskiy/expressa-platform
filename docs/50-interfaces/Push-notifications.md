---
title: "Push-уведомления и привязки"
type: interface
owner: root
last_verified: 2026-10-10
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/notifications/transport/push-subscriptions.controller.ts
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
knowledge_role: implementation
scope: system
---

# Push-уведомления и привязки

Текущие маршруты: `GET /api/v2/push/public-key`, `POST /api/v2/push/subscriptions/inspect`, `PUT /api/v2/push/subscriptions/association`, `DELETE /api/v2/push/subscriptions/association`. Точные HTTP-схемы — [OpenAPI](../../backend/openapi/openapi.json), реализация — [controller](../../backend/src/notifications/transport/push-subscriptions.controller.ts). Все маршруты требуют сессии; inspect и association доступны Customer и Barista, без Administrator. Точная роль-политика принадлежит [RolesGuard](../../backend/src/auth/transport/roles.guard.ts), а не машиночитаемой схеме OpenAPI. Описание операции поясняет доступ, но не заменяет серверную проверку.

[Серверная нота](../../backend/docs/30-domains/Notifications.md) описывает proof/version,
отказ Barista в любом чужом переносе, сохранённое поведение Customer и выбор
получателей нового заказа только среди Barista. Она также фиксирует существующие
ограничения конкурентной смены роли и уже выбранной асинхронной отправки;
атомарная повторная проверка роли или немедленная отмена не обещаны.

Прямых маршрутов записи / удаления subscription нет. Logout, проверка подписки без действующей сессии, повтор запроса, транзакции и ошибки cookie описаны в [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).

Разрешение браузера, локальная подписка, серверная association и доставка уведомления — разные состояния. Наличие API привязки не является доказательством доставки push.

## Staff frontend

Текущие новые [владельцы staff](../../back-office/docs/10-architecture/staff-read-slice.md#уведомления-и-logout)
реализуют Barista-only deliberate opt-in и own unlink. Read/open не создают
регистрацию, prompt, subscription или association. Unready enable подготавливает
own worker и настоящий ключ, затем требует нового жеста; native subscribe
вызывается до await. Только validated current association подтверждает
подключение; other не переносится и не сбрасывается.

Sent unknown сохраняет исходные proof/version/identity privately, без replay.
Exact inspect показывает текущую привязку отдельно; локальное завершение
проверки не доказывает автора или исход отправки. App logout supplier после
session pending сверяет реальный own native proof с confirmed-own того же
identity и передаёт exact object либо null по ADR009. Это не atomic ownership,
browser revoke, local unsubscribe или отмена уже выбранной доставки.

Push-only [worker](../../back-office/src/app/staff-push.worker.ts) показывает
валидированный title/body/order UUID. Arrival не меняет workspace. Click
передаёт bounded tuple одному owned view; client подтверждает latest tuple у
current active worker, guards identity/input/lifetime и сохраняет занятую
работу. Cold scope URL открывается только при отсутствии owned view; duplicate
fallback и WindowClient.navigate отсутствуют. Runtime restart/потеря сообщения/
standalone reuse остаются возможными; exactly-once и независимое окно не обещаны.

Текущие backend D13 и frontend исходники не имеют полной live/native/visual
приёмки. Сборка, контрактные байты и нормативное требование не доказывают
permission/association/delivery/click/install или безопасность concurrent исхода.
