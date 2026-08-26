---
title: Интерфейс back-office
type: interface
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../back-office/src/app/router.ts
  - ../../back-office/src/app/router.constants.ts
  - ../../back-office/src/pages/MenuPage.vue
  - ../../back-office/src/pages/admin/menu/catalog.store.ts
  - ../../back-office/src/pages/QueuePage.vue
---

# Интерфейс back-office

## Активные границы

Маршрутизатор регистрирует `/login`, `/queue`, `/availability`, `/menu`; guard
восстанавливает сессию и направляет неаутентифицированного сотрудника на вход.
[back-office/src/app/router.ts:createBackOfficeRouter](../../back-office/src/app/router.ts).

`/menu` — активная administrator-страница. Она показывает loading, error с
повтором и подтверждённый empty; во время loading контент получает `aria-busy`
и блокируется. [back-office/src/pages/MenuPage.vue:entry](../../back-office/src/pages/MenuPage.vue).

`useCatalogStore` владеет каноническим каталогом, запросом, ошибкой полей и
флагом результата команды; после mutation он заново читает каталог.
[back-office/src/pages/admin/menu/catalog.store.ts:useCatalogStore](../../back-office/src/pages/admin/menu/catalog.store.ts).

`MenuPage` владеет refs открытия и передаёт их в dialog components.
[back-office/src/pages/MenuPage.vue:entry](../../back-office/src/pages/MenuPage.vue).

Breakpoint мобильного диалога — не шире 767px.
[back-office/src/shared/ui/admin/admin-dialog/AdminDialog.constants.ts:ADMIN_DIALOG_MOBILE_MEDIA_QUERY](../../back-office/src/shared/ui/admin/admin-dialog/AdminDialog.constants.ts).

На мобильной ширине `AdminDialog` располагается снизу по центру; иначе — по
центру экрана. [back-office/src/shared/ui/admin/admin-dialog/AdminDialog.vue:dialogLocation](../../back-office/src/shared/ui/admin/admin-dialog/AdminDialog.vue).

Поверхность dialog имеет нижние скругления на мобильном экране, полные
скругления от 768px и max-height 90vh.
[back-office/src/shared/ui/admin/admin-dialog/AdminDialog.vue:admin-dialog__surface](../../back-office/src/shared/ui/admin/admin-dialog/AdminDialog.vue).

## Очередь и управление доступностью

`/queue` и `/availability` защищены role metadata. [back-office/src/app/router.constants.ts:backOfficeRoutes](../../back-office/src/app/router.constants.ts).

`/queue` — активная очередь заказов. `QueuePage` владеет запросами списка и
деталей, поиском, фильтром стадии, обновлением каждые 5 секунд и ошибками;
`OrdersScreen` показывает loading, error и empty, а `OrderCard` показывает
снимок, события и только следующее допустимое действие.
[QueuePage](../../back-office/src/pages/QueuePage.vue), [OrdersScreen](../../back-office/src/pages/admin/orders/OrdersScreen.vue), [OrderCard](../../back-office/src/pages/admin/orders/OrderCard.vue).

`/availability` — активное управление доступностью. `AvailabilityPage` загружает
категории и приём заказов, а `AvailabilityScreen` показывает поиск, фильтр и
переключатели доступности.
[AvailabilityPage](../../back-office/src/pages/AvailabilityPage.vue),
[AvailabilityScreen](../../back-office/src/pages/admin/availability/AvailabilityScreen.vue).

`AvailabilityScreen` — активный дочерний UI `AvailabilityPage`; `UsersScreen` и
`SettingsScreen` не зарегистрированы среди active routes.
[back-office/src/app/router.constants.ts:backOfficeRoutes](../../back-office/src/app/router.constants.ts).
