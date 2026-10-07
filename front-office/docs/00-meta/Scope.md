---
title: "Контур front-office"
type: scope
owner: front-office
last_verified: 2026-10-08
sources:
  - ../../src/app/router.ts
knowledge_role: implementation
scope: front-office
---

# Контур front-office

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

Front-office обслуживает покупателя: меню, конфигурация товара, корзина, OTP, история и детали заказа. Граница с backend — HTTP через `shared/api`; устройство задают [маршрутизатор](../../src/app/router.ts) и [API-клиент](../../src/shared/api/client.ts).

## Маршруты

| Маршрут                     | Поведение                                                                    | Источник                                     |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| `/`                         | Меню и добавление настроенного товара в корзину                              | [MenuPage](../../src/pages/MenuPage.vue)     |
| `/cart`                     | Изменение корзины и checkout после входа                                     | [CartPage](../../src/pages/CartPage.vue)     |
| `/auth/phone`, `/auth/code` | Запрос и проверка OTP с внутренним `returnTo`                                | [Router](../../src/app/router.ts)            |
| `/orders/:id`               | Загрузка собственного заказа с backend и подготовка повтора выданного заказа | [OrderPage](../../src/pages/OrderPage.vue)   |
| `/orders`                   | История с пагинацией и переходом к деталям / повтору                         | [OrdersPage](../../src/pages/OrdersPage.vue) |

История и детали требуют customer-сессию. Guard и чтение защищённых данных принадлежат [session store](../../src/app/session.store.ts); наличие маршрута не подтверждает визуальную приёмку.

## Используемые API

- Авторизация: текущие v2 OTP, refresh, logout с обязательным body и `me`; [auth API](../../src/shared/api/auth.api.ts).
- Меню: `GET /api/v3/public/menu`; [public-menu API](../../src/shared/api/public-menu.api.ts).
- Заказы: создание, история и детали под `/api/v3/orders`; [orders API](../../src/shared/api/orders.api.ts) и [пути](../../src/shared/api/orders.api.constants.ts).
- Push: public key, inspect и association; [push API](../../src/shared/api/push.api.ts).

Повтор в текущем UI загружает меню и собирает корзину локально в `OrderPage`; наличие серверного `/repeat` не означает его вызов клиентом. Точные серверные схемы находятся в [OpenAPI](../../contracts/openapi.json).

Связанное: [заказы](../30-features/Orders.md), [состояние и API](../20-architecture/Application-state-and-API.md), [покрытие](../COVERAGE.md).
