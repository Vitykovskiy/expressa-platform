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

После успешного checkout маршрут `/orders/:id` показывает только заказ из
текущего checkout store. При отсутствии совпадающего id виден статус
недоступности; повторная загрузка страницы не восстанавливает заказ из API.
Экран — grid с максимумом 48rem; строка товара имеет `min-width: 0`, переносит
длинные имя и модификаторы, а цена остаётся справа. Список подписан
`aria-label`, пустой результат имеет `role=status`; отдельных breakpoint нет,
поэтому layout одинаков на всех ширинах. [Источник: OrderPage](../../src/pages/OrderPage.vue).

`/orders` защищён navigation guard, но сейчас отображает только `PageShell` с
текстом истории: запрос списка и интеграция `OrdersHistoryScreen` не реализованы.
Это граница текущего сценария, не активная история заказов.
[Источники: OrdersPage](../../src/pages/OrdersPage.vue), [router](../../src/app/router.ts).

`OrdersHistoryScreen`/`OrderCard` — story-only orphan UI, не часть активного
маршрута: consumer передаёт данные, refresh и обработчик. Экран показывает
`aria-busy`, именованную кнопку, empty list и раскрытие через `aria-expanded`;
на 768/1024px меняет layout, `OrderCard` скрывает переполнение.
[Источники: screen](../../src/features/orders/OrdersHistoryScreen.vue), [card](../../src/features/orders/OrderCard.vue).

Проверка доступного результата: [OrderPage spec](../../src/pages/OrderPage.spec.ts).
