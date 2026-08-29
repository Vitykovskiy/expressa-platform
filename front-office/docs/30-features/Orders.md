---
type: feature
owner: front-office
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/pages/OrderPage.vue
  - ../../src/pages/OrdersPage.vue
  - ../../src/features/orders/OrdersHistoryScreen.vue
---

# Заказы

Защищённый маршрут `/orders` показывает историю заказов текущего customer.
Экран загружает первую страницу, позволяет обновить список и, при наличии
курсора, подгрузить следующую. Карточка истории показывает номер, дату, сумму
и стадию; customer раскрывает состав или открывает детальную страницу заказа.
Пустая история и ошибка загрузки имеют самостоятельные состояния.
[Источники: OrdersPage](../../src/pages/OrdersPage.vue),
[OrdersHistoryScreen](../../src/features/orders/OrdersHistoryScreen.vue),
[OrderCard](../../src/features/orders/OrderCard.vue),
[router](../../src/app/router.ts).

`/orders/:id` загружает принадлежащий customer заказ из API и показывает
сохранённый снимок позиций, текущую стадию, сумму и оплату на кассе. Страница
обновляет невыданный заказ, пока открыта и приложение видно. Для выданного
заказа доступна кнопка `Повторить заказ`: она сверяет снимок с текущим меню,
использует актуальные цены и открывает `/cart`. Полный и частичный повтор с
пустой корзиной применяется сразу; непустая корзина заменяется только после
подтверждения customer, а отмена ничего не меняет. Частичный повтор показывает
в корзине временные предупреждения с товаром, причиной и, при необходимости,
деталями прежней конфигурации. При нулевом повторе открывается корзина с этими
предупреждениями, но её существующие позиции сохраняются. Предупреждения не
сохраняются в `localStorage`; полный сквозной контракт — в
[системной ноте](../../../docs/40-features/Track-history-and-repeat-order.md).
[Источники: OrderPage](../../src/pages/OrderPage.vue),
[cart store](../../src/entities/customer/model/cart.store.ts),
[CartScreen](../../src/features/checkout/CartScreen.vue),
[OrderPage spec](../../src/pages/OrderPage.spec.ts).

На детальной странице customer по кнопке может включить или отключить
push-уведомления. Подписка не запрашивается автоматически; нажатие на
уведомление открывает соответствующий заказ. Эта реализация покрывает
customer-уведомления о стадиях `Принят`, `Готов` и `Выдан`. UI для разрешения,
подписки и открытия нового заказа из push у barista в back-office отсутствует:
это отдельный `required-blocked` контур `FR-PUSH-002`, `FR-PUSH-004` и
`FR-PUSH-005`, а не ограничение customer push.
[Источники: OrderPage](../../src/pages/OrderPage.vue),
[push handler](../../src/app/push-notifications.ts),
[Push notifications](../../../docs/50-interfaces/Push-notifications.md).

Проверка доступного результата: [OrderPage spec](../../src/pages/OrderPage.spec.ts).

Карта раздела: [сценарии](INDEX.md).
