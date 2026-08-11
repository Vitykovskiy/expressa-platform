---
title: Просмотр меню и сбор корзины
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../front-office/docs/30-features/Menu-and-configuration.md
---

# Просмотр меню и сбор корзины

Гость открывает front-office, получает `GET /api/v1/public/menu`, выбирает
категорию и конфигурирует товар; готовая позиция добавляется в локальную корзину.
Экран покрывает loading/error/empty и недоступные варианты. [Front menu](../../front-office/docs/30-features/Menu-and-configuration.md),
[маршрут](../../front-office/src/app/router.ts), [API](../../backend/openapi/openapi.json).

Корзина объединяет только одинаковую конфигурацию и передаёт её в отдельный
checkout-сценарий; revalidation цены, доступности и приёма заказов происходит
на `POST /api/v1/orders`. [Cart/checkout](../../front-office/docs/30-features/Cart-and-checkout.md),
[orders](../../backend/docs/30-domains/Orders.md).
