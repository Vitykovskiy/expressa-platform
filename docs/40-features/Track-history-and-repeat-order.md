---
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../front-office/src/pages/OrdersPage.vue
  - ../../front-office/src/pages/OrderPage.vue
---

# Текущий заказ, история и повтор

## 6.4. Повтор заказа

### 8.6. История заказов

### 8.9. Push-уведомления

Авторизованный customer открывает `/orders` и видит только собственные заказы:
список загружается от новых к старым, поддерживает обновление и подгрузку
следующей страницы. Из списка доступна защищённая детальная страница
`/orders/:id` со снимком состава, текущей стадией и суммой заказа.
[Источники: OrdersPage](../../front-office/src/pages/OrdersPage.vue),
[OrderPage](../../front-office/src/pages/OrderPage.vue),
[OpenAPI](../../backend/openapi/openapi.json).

Для выданного заказа customer может нажать `Повторить заказ`. Front-office
сверяет снимок с текущим публичным меню и собирает воспроизводимые позиции с
актуальными ценами. Полный и частичный повтор с пустой корзиной сразу открывает
`/cart`; с непустой корзиной customer подтверждает замену, а отмена оставляет
корзину и детальную страницу без изменений. При частичном повторе корзина
показывает перенесённые позиции и временные предупреждения с именем товара,
причиной, а для конфигурации — её деталями. Когда не переносится ни одна
позиция, `/cart` открывается с предупреждениями, а непустая корзина сохраняется.
Предупреждения не записываются в `localStorage`.
[Источники: OrderPage](../../front-office/src/pages/OrderPage.vue),
[cart store](../../front-office/src/entities/customer/model/cart.store.ts),
[CartScreen](../../front-office/src/features/checkout/CartScreen.vue),
[OrderPage spec](../../front-office/src/pages/OrderPage.spec.ts).

На детальной странице customer по явному действию включает или отключает
push-уведомления; нажатие customer-уведомления открывает соответствующий
заказ. Backend отправляет customer уведомления при стадиях `Принят`, `Готов`
и `Выдан`. Уведомление barista о новом заказе предусмотрено ТЗ и отправляется
backend, но в back-office нет UI для разрешения, подписки или перехода по
уведомлению. Это отдельный нереализованный пользовательский контур, не
свойство customer push.
[Источники: Push notifications](../50-interfaces/Push-notifications.md),
[OrderPage](../../front-office/src/pages/OrderPage.vue),
[back-office App](../../back-office/src/app/App.vue).
