---
title: "История, детали и повтор заказа"
type: feature
owner: front-office
last_verified: 2026-10-08
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/orders.api.ts
knowledge_role: implementation
scope: front-office
---

# История, детали и повтор заказа

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

## Чтение и создание

Клиент создаёт заказ и читает историю / детали через v3 API. Методы и преобразование ответов находятся в [orders.api.ts](../../src/shared/api/orders.api.ts), пути — в [константах](../../src/shared/api/orders.api.constants.ts).

`OrdersPage` загружает страницы истории и открывает детали. `OrderPage` читает заказ с backend, показывает сохранённый состав, сумму и стадию; данные не ограничены результатом последнего checkout. [История](../../src/pages/OrdersPage.vue), [детали](../../src/pages/OrderPage.vue).

## Повтор в UI

Повтор доступен выданному заказу. `OrderPage` загружает актуальное меню, сопоставляет товары, выбранные ценовые опции и модификаторы по id и готовит новую корзину. Недоступные или несохраняемые конфигурации дают предупреждения; непустая корзина требует подтверждения замены. Оформление нового заказа выполняется отдельным checkout.

Этот путь реализован локально; клиентский orders API не вызывает серверный `POST /api/v3/orders/{orderId}/repeat`. Серверный endpoint остаётся в [OpenAPI](../../contracts/openapi.json). Не выводите использование endpoint из его присутствия в снимке.

## Модель и ошибки

Снимок содержит nullable `portionLabel` и `priceChoiceId`; модели variant/S-M-L нет. История и детали используют защищённое чтение сессии. Ошибка загрузки не подтверждает отсутствие заказа: экран показывает ошибку и доступное восстановление. При границе сессии данные очищаются. [OrderPage](../../src/pages/OrderPage.vue), [OrdersPage](../../src/pages/OrdersPage.vue), [session store](../../src/app/session.store.ts).
