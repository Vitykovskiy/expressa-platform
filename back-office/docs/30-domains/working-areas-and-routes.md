---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-09-20
sources:
  - ../../src/app/router.ts
  - ../../src/app/router.constants.ts
  - ../../src/app/session.store.ts
  - ../../src/pages/LoginPage.vue
---

# Рабочие разделы и маршруты back-office

Маршрутизатор восстанавливает сессию перед переходом. Анонимный пользователь на защищённом URL попадает на `/login`; сотрудник на `/login` — на первый доступный раздел. Полный контракт входа и ролей — в [Authentication-and-role-gates](Authentication-and-role-gates.md). Источники: [router.ts](../../src/app/router.ts), [router.spec.ts](../../src/app/router.spec.ts).

| URL             | Роли                   | Статус и наблюдаемое поведение                              |
| --------------- | ---------------------- | ----------------------------------------------------------- |
| `/`             | —                      | `redirect` на `/queue`.                                     |
| `/login`        | анонимный              | Активен; см. [вход](Authentication-and-role-gates.md).      |
| `/queue`        | barista, administrator | Активен; см. [неактивные экраны](Inactive-screens.md).      |
| `/availability` | barista, administrator | Активен; см. [неактивные экраны](Inactive-screens.md).      |
| `/menu`         | administrator          | Активен; см. [управление каталогом](Catalog-management.md). |

Навигация показывает barista только очередь и доступность, administrator — также меню. Источник таблицы: [router.constants.ts](../../src/app/router.constants.ts), [navigation.constants.ts](../../src/app/navigation.constants.ts), [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [MenuPage.vue](../../src/pages/MenuPage.vue).

`LoginPage` импортирует `AuthScreen`, поэтому это активный дочерний UI `/login`, а не orphan. Остальные административные экраны, не импортируемые маршрутизатором, перечислены в [неактивных экранах](Inactive-screens.md). Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [router.constants.ts](../../src/app/router.constants.ts).

При добавлении раздела одновременно обновляются маршрут, карта навигации и тесты [router.spec.ts](../../src/app/router.spec.ts).

## Цена и подпись в существующих рабочих разделах

Маршруты используют гибридную API-границу: `/menu` читает v3 catalog и
управляет товарами через v3 price-choice endpoints, а категории и modifiers
остаются v2. `/availability` читает Staff v2 availability/intake, включая
active non-archived price choices и product-level modifier assignments, и
использует v3 только для price-choice availability mutation. `/queue` читает list/details через v3, а lifecycle
transitions остаются v2. Принятый
целевой контракт описан в
[ADR-006](../../../docs/20-architecture/ADR/ADR-006-product-variant-portions.md)
и не требует новых маршрутов:

- `/menu` ведёт одну цену либо минимум два упорядоченных варианта цены через
  непрерывный сценарий без unit/default/type controls;
- `/availability` показывает plain-text подпись и переключает ручную
  доступность выбранного price choice по стабильному id;
- `/queue` в свёрнутом и раскрытом виде показывает название, сохранённую
  подпись при её наличии и количество, а модификаторы — отдельно. Legacy
  `S/M/L` остаётся дословным снимком.

Новые маршруты не нужны. Legacy `S/M/L` сохраняется только как дословный
снимок старых заказов; автоматизированные component-проверки не запускались в
рамках текущего ограничения приёмки.
