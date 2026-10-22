---
title: "Жизненный цикл заказа"
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-lifecycle.constants.ts
  - ../../backend/src/orders/adapters/postgres-order-lifecycle.repository.ts
knowledge_role: implementation
scope: system
---

# Жизненный цикл заказа

## Стадии и выдача

Заказ проходит стадии `CREATED` → `ACCEPTED` → `PREPARING` → `READY` → `ISSUED`.
Каждый успешный переход атомарно сохраняет новую стадию и событие с автором,
временем, исходной и целевой стадией. [Источник: lifecycle](../../backend/src/orders/domain/order-lifecycle.constants.ts), [PostgreSQL repository](../../backend/src/orders/adapters/postgres-order-lifecycle.repository.ts).

Выдача переводит заказ из `READY` в `ISSUED`; отдельная хранимая модель оплаты
не создаётся. Клиент видит оплату на кассе при получении. [OpenAPI](../../backend/openapi/openapi.json), [интерфейс front-office](../50-interfaces/Front-office-UI.md).

Создание требует customer и ключ идемпотентности; подробности запроса —
[Orders API](../50-interfaces/Orders-API.md).

## Целевой контракт полного back-office

[ADR-012](../20-architecture/ADR/ADR-012-back-office-source-contract.md)
расширяет прежнее исключение MVP для конкретного макета. Пять стадий
сохраняются. Отказ — отдельные терминальные метаданные только для `CREATED`,
с точной причиной, автором и временем; отказавшийся заказ больше не переходит
по старым или новым командам. Новая команда `ready` из `ACCEPTED` атомарно
сохраняет оба законных перехода с одним автором и временем, из `PREPARING` —
один. Получателю отправляется одна итоговая best-effort push после commit.

Настройки рабочих часов и вместимости применяются только к новым заказам и
повторам. Распределение ближайшего десятиминутного окна текущего UTC-дня
сериализуется блокировкой singleton настроек в той же транзакции, что номер,
идемпотентность и снимки. Повтор ключа возвращает прежний заказ до выделения
нового места; при исчерпании дня возвращается `409 ORDER_CAPACITY_UNAVAILABLE`.
Отклонённые и выданные заказы не занимают вместимость. Настройки не перемещают
существующие заказы и не меняют их снимки. Точная политика и разрешённые роли —
в ADR-012; это новое ограниченное решение, а не прежнее требование MVP.
