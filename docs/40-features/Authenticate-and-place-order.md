---
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../front-office/src/pages/CartPage.vue
---

# Авторизация и оформление заказа

## 6.2. Авторизация и оформление

### 8.1. Телефонная авторизация

Гость из корзины идёт на OTP с внутренним `returnTo`; customer отправляет
checkout. Успех очищает корзину и открывает `/orders/:id`; страница читает только
сохранённый результат checkout. [Источники: CartPage](../../front-office/src/pages/CartPage.vue), [OrderPage](../../front-office/src/pages/OrderPage.vue).

Network повторяет тот же ключ; изменение total требует reconfirm, unavailable
выделяет позиции. Submit отключает только `acceptsNewOrders=false`; ответ
`ORDER_INTAKE_CLOSED` показывает ошибку checkout, но не делает retry permanently
disabled. [Источники: CartPage](../../front-office/src/pages/CartPage.vue), [CartScreen](../../front-office/src/features/checkout/CartScreen.vue), [checkout store](../../front-office/src/features/checkout/checkout.store.ts).
