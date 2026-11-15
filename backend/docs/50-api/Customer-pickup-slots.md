---
title: "Время получения customer-заказа"
type: contract
owner: backend
knowledge_role: requirements
scope: backend
sources:
  - ../../../docs/20-architecture/ADR/ADR-018-customer-pickup-selection.md
---

# Время получения customer-заказа

Добавочный контракт задаёт [ADR-018](../../../docs/20-architecture/ADR/ADR-018-customer-pickup-selection.md); HTTP-граница реализована в [OrdersV3Controller](../../src/orders/transport/orders-v3.controller.ts). Независимая приёмка ещё не подтверждена.

Customer читает `GET /api/v3/orders/pickup-slots` без резервирования. Ответ содержит `serviceDay`, `timeZone: UTC`, `slotMinutes: 10`, `acceptsNewOrders` и `slots` с `startsAt`, `endsAt`, `available`. Часы, время БД и занятость читаются в согласованном snapshot; ответ не кешируется.

`POST /api/v3/orders` принимает необязательный `pickupSlotStart` в каноническом UTC ISO. Отсутствие сохраняет автоматический выбор ближайшего окна; null или неверный формат дают `400 VALIDATION_ERROR`. Сервер выводит конец интервала сам. Занятое, прошедшее или изменённое настройками окно даёт `409 PICKUP_SLOT_UNAVAILABLE`, без подмены времени. Автоматическое исчерпание даёт прежний `409 ORDER_CAPACITY_UNAVAILABLE`. Клиент очищает выбор, перечитывает доступность и ждёт явного нового выбора.

Replay проверяется до временной/ёмкостной ревалидации и возвращает исходный заказ после истечения времени. Один ключ с другой выбранной датой либо автоматическим запросом даёт `409 IDEMPOTENCY_KEY_REUSED`. При сетевой неопределённости клиент повторяет прежнее тело и ключ. Формат ошибок остаётся `{code,message,details,requestId}`.
