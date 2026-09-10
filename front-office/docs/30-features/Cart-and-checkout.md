---
type: feature
owner: front-office
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/pages/CartPage.vue
  - ../../src/features/checkout/checkout.store.ts
---

# Корзина и оформление

`/cart` показывает сохранённые позиции, меняет количество и отправляет заказ
после customer-аутентификации. [Источники: page](../../src/pages/CartPage.vue), [screen](../../src/features/checkout/CartScreen.vue).

| Область  | Действия, состояния и результат                                                                                                                                                                             | Источник                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Корзина  | пустая корзина ведёт к меню; удаление или количество сбрасывают checkout-ошибку и временный feedback повтора, затем сохраняют новое содержимое                                                              | [CartPage](../../src/pages/CartPage.vue)                                                                              |
| Позиция  | удалить, плюс/минус, unavailable и прежняя цена видимы; количество объявляется live                                                                                                                         | [CartItem](../../src/features/checkout/CartItem.vue)                                                                  |
| Отправка | anonymous видит объяснение подтверждения телефона и идёт на `/auth/phone?returnTo=/cart`; submitting блокирует кнопку; success очищает корзину и открывает `/orders/:id`                                    | [CartPage](../../src/pages/CartPage.vue), [screen](../../src/features/checkout/CartScreen.vue)                        |
| Ошибка   | network повторяется; totalChanged показывает старый и новый итоги с явным подтверждением; itemUnavailable выделяет позиции; подтверждённый intakeClosed запрещает отправку и даёт одну проверку доступности | [checkout store](../../src/features/checkout/checkout.store.ts), [screen](../../src/features/checkout/CartScreen.vue) |

Экран имеет мобильную фиксированную кнопку и desktop summary на 1024px; списки,
итог и сообщения имеют именованные регионы и status. При изменении итога
предыдущая и новая суммы в обоих layout — отдельные доступные группы с точными
названиями и суммами. В мобильной навигации перед переходом к заказам доступна
кнопка «Меню» с доступным именем. Переполнение имени позиции обрабатывает
layout `CartItem`.
[Источники: CartScreen](../../src/features/checkout/CartScreen.vue), [CartItem](../../src/features/checkout/CartItem.vue).

`SlotPickerScreen` и `SlotOption` существуют как UI-контракт слотов (loading,
error, выбранный/disabled), но `/cart` их не подключает и slot не входит в заказ.
[Источники: slot picker](../../src/features/checkout/SlotPickerScreen.vue), [CartPage](../../src/pages/CartPage.vue).

Частичный или нулевой повтор рядом с подробными предупреждениями сообщает
`Добавлено X из Y позиций`. Это временный результат фактической оценки позиций
исходного заказа: `cart` store не сохраняет его в `localStorage` и очищает его
на тех же границах, что и предупреждения повтора.

Проверки: [CartScreen spec](../../src/features/checkout/CartScreen.spec.ts), [checkout store spec](../../src/features/checkout/checkout.store.spec.ts), [e2e](../../tests/e2e/checkout.e2e.spec.ts).

Карта раздела: [сценарии](INDEX.md).
