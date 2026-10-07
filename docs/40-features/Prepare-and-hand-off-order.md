---
title: "Приготовление и выдача заказа"
type: feature
owner: root
last_verified: 2026-08-11
sources:
  - ../../back-office/src/pages/QueuePage.vue
  - ../../backend/src/orders/transport/backoffice-orders.controller.ts
knowledge_role: implementation
scope: system
---

# Приготовление и выдача заказа

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

## Приготовление и выдача

Сотрудник ведёт заказ в `/queue`: открывает детали, видит снимок позиций и
историю переходов, затем выполняет доступное следующее действие. Сценарий
последовательно переводит заказ `CREATED` → `ACCEPTED` → `PREPARING` → `READY`
→ `ISSUED`. [QueuePage](../../back-office/src/pages/QueuePage.vue), [OrdersScreen](../../back-office/src/pages/admin/orders/OrdersScreen.vue), [API](../../backend/src/orders/transport/backoffice-orders.controller.ts).

Оплата выполняется на кассе при получении; выдача остаётся переходом `READY` в
`ISSUED`, а не отдельным платёжным сценарием. [Интерфейс front-office](../50-interfaces/Front-office-UI.md).

Если ответ на переход не подтверждает результат, очередь не повторяет `POST`
автоматически. Она читает текущее состояние заказа; при неудаче такой проверки
сохраняет выбранные детали и предлагает одну проверку состояния. [QueuePage](../../back-office/src/pages/QueuePage.vue).
