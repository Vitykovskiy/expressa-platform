---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.ts
  - ../../src/app/router.constants.ts
  - ../../src/app/session.store.ts
  - ../../src/pages/LoginPage.vue
---

# Рабочие разделы и маршруты back-office

Маршрутизатор восстанавливает сессию перед переходом. Анонимный пользователь на защищённом URL попадает на `/login`; сотрудник на `/login` — на первый доступный раздел. Полный контракт входа и ролей — в [Authentication-and-role-gates](Authentication-and-role-gates.md). Источники: [router.ts](../../src/app/router.ts), [router.spec.ts](../../src/app/router.spec.ts).

| URL | Роли | Статус и наблюдаемое поведение |
| --- | --- | --- |
| `/` | — | `redirect` на `/queue`. |
| `/login` | анонимный | Активен; см. [вход](Authentication-and-role-gates.md). |
| `/queue` | barista, administrator | Активен; см. [неактивные экраны](Inactive-screens.md). |
| `/availability` | barista, administrator | Активен; см. [неактивные экраны](Inactive-screens.md). |
| `/menu` | administrator | Активен; см. [управление каталогом](Catalog-management.md). |

Навигация показывает barista только очередь и доступность, administrator — также меню. Источник таблицы: [router.constants.ts](../../src/app/router.constants.ts), [navigation.constants.ts](../../src/app/navigation.constants.ts), [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [MenuPage.vue](../../src/pages/MenuPage.vue).

`LoginPage` импортирует `AuthScreen`, поэтому это активный дочерний UI `/login`, а не orphan. Остальные административные экраны, не импортируемые маршрутизатором, перечислены в [неактивных экранах](Inactive-screens.md). Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [router.constants.ts](../../src/app/router.constants.ts).

При добавлении раздела одновременно обновляются маршрут, карта навигации и тесты [router.spec.ts](../../src/app/router.spec.ts).
