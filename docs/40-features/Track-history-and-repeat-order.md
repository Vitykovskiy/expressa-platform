---
title: "Текущий заказ, история и повтор"
type: feature
owner: root
implementation_status: current
last_verified: 2026-10-08
sources:
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
knowledge_role: implementation
scope: system
---

# Текущий заказ, история и повтор

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

Покупатель читает историю `/orders` и собственный заказ `/orders/:id` через v3 API. Детали показывают снимок состава, сумму и текущую стадию, а не изменившийся каталог. [История](../../front-office/src/pages/OrdersPage.vue), [детали](../../front-office/src/pages/OrderPage.vue), [снимки заказа](../30-domain/Order-snapshots.md).

Повтор выданного заказа в текущем UI заново читает меню и готовит корзину локально; при необходимости покупатель подтверждает её замену. Недоступные конфигурации не подменяются совпадающим названием. Новый заказ оформляется через checkout. Серверный `/repeat` существует, но этот клиентский путь его не вызывает. Точный владелец сценария — [front-office / заказы](../../front-office/docs/30-features/Orders.md).

Push-привязка и logout текущего браузера описаны в [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Logout не меняет разрешение браузера и локальную подписку.
