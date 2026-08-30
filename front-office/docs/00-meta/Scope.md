---
type: scope
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.ts
---

# Контур front-office

Клиент обслуживает посетителя: просмотр меню, настройка товара, корзина,
одноразовый код и результат оформления. Он связан с backend только HTTP-запросами
из `shared/api`; исходных импортов из других контуров нет.
[Источники: маршруты](../../src/app/router.ts), [API-клиент](../../src/shared/api/client.ts).

## Маршруты и сценарии

| Маршрут                     | Экран и результат                                             | Источник                                     |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `/`                         | загрузка меню, выбор категории и товара, добавление в корзину | [MenuPage](../../src/pages/MenuPage.vue)     |
| `/cart`                     | изменение корзины и отправка заказа после входа               | [CartPage](../../src/pages/CartPage.vue)     |
| `/auth/phone`, `/auth/code` | запрос и проверка OTP-кода с безопасным возвратом             | [router](../../src/app/router.ts)            |
| `/orders/:id`               | только что созданный заказ из checkout-состояния              | [OrderPage](../../src/pages/OrderPage.vue)   |
| `/orders`                   | защищённая оболочка «История заказов» без загрузки данных     | [OrdersPage](../../src/pages/OrdersPage.vue) |

## Потребляемый API

Клиент использует только `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`,
`/auth/logout`, `/me`, `/public/menu`, `POST /orders`, `GET /orders`,
`GET /orders/:id`, `GET /push/public-key` и `PUT`/`DELETE` `/push/subscriptions`;
[Источник order endpoints](../../src/shared/api/orders.api.ts).
back-office пути снимка не потребляются. [Источник: OpenAPI](../../contracts/openapi.json),
[API-клиент](../../src/shared/api/client.ts),
[Push API](../../src/shared/api/push.api.ts).

Связанное: [покрытие](../COVERAGE.md), [состояние и API](../20-architecture/Application-state-and-API.md).
