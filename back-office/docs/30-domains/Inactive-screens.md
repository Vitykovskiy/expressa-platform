---
title: "Границы экранов"
type: feature
implementation_status: current
owner: back-office
last_verified: 2026-10-08
sources:
  - ../../src/app/router.constants.ts
  - ../../src/pages/QueuePage.vue
  - ../../src/pages/AvailabilityPage.vue
knowledge_role: implementation
scope: back-office
---

# Границы экранов

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

`/queue` и `/availability` — активные маршруты для barista и administrator.
`QueuePage` показывает очередь, поиск, фильтр стадии, детали заказа и доступное
следующее действие; `AvailabilityPage` показывает приём заказов и доступность
товаров, вариантов цены и добавок. Guard не допускает на эти маршруты customer.
[QueuePage.vue](../../src/pages/QueuePage.vue),
[AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue),
[router.constants.ts](../../src/app/router.constants.ts).

`OrdersScreen` и `AvailabilityScreen` входят в активные страницы соответственно
очереди и управления доступностью. `AuthScreen` используется на активном `/login`.
В runtime остаются только экранные композиции действующих маршрутов: вход,
очередь, доступность, меню и редактирование товара. Неиспользуемые композиции
управления пользователями и настроек вместе с их каталоговыми историями удалены;
действующих маршрутов для них нет.
[LoginPage.vue](../../src/pages/LoginPage.vue),
[MenuPage.vue](../../src/pages/MenuPage.vue),
[ProductEditPage.vue](../../src/pages/ProductEditPage.vue),
[router.constants.ts](../../src/app/router.constants.ts).

Создание учётных записей сотрудников и изменение ролей остаются операционными
командами backend; удаление неподключённого UI их не меняет.
[Роли и права](../../../docs/10-overview/Roles-and-access.md).
