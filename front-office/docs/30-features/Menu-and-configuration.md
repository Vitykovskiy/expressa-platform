---
type: feature
owner: front-office
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/pages/MenuPage.vue
  - ../../src/features/menu/MenuFlow.vue
---

# Меню и конфигурация

Маршрут `/` загружает публичное меню, показывает категории, товар и его
конфигурацию, затем добавляет готовую позицию в корзину. [Источники: page](../../src/pages/MenuPage.vue), [flow](../../src/features/menu/MenuFlow.vue).

| Область   | Действия, состояния и видимый результат                                                                                                                                                                                                                                                                                                                                                                                                                                               | Источник                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Меню      | загрузка, ошибка с «Повторить», пустое меню, предупреждение о закрытом приёме; ошибка не выводит технический ответ API                                                                                                                                                                                                                                                                                                                                                                | [MenuPage](../../src/pages/MenuPage.vue)                                                                                                                  |
| Навигация | category, product, Back и browser history меняют root/category/product. Ниже 1024px left-aligned бренд «Экспресса» без House — один button «Перейти в меню», который возвращает к root; Back находится в собственной left-aligned contextual row под header и перед content category/product, а не в title row; Account, History и Cart постоянны справа в header. Информационных «N позиций» на root и category нет. От 1024px Cart находится в sidebar, со счётчиком из `cartStore` | [MenuFlow](../../src/features/menu/MenuFlow.vue), [CustomerShell](../../src/widgets/customer-shell/ShellNavigation.vue)                                   |
| Сетка     | корневой экран сразу показывает товары под заголовками категорий; «Все позиции» сохраняет переход в категорию. Карточка показывает доступность и фактическое описание, если оно есть; категория без товаров показывает статус                                                                                                                                                                                                                                                         | [root](../../src/features/menu/MenuRootScreen.vue), [group](../../src/features/menu/MenuGroupScreen.vue), [card](../../src/features/menu/ProductCard.vue) |
| Товар     | вариант напитка, опции, количество и итог меняются до submit; недопустимая конфигурация не отправляется. Ниже 1024px in-flow footer достигает низа usable viewport при коротком контенте и остаётся sticky при длинном; при 320px counter/action складываются, от 1024px footer статичен                                                                                                                                                                                              | [detail](../../src/features/menu/ProductDetailScreen.vue), [flow](../../src/features/menu/MenuFlow.vue)                                                   |

Физическая `displayLabel` выводится на карточке и в конфигурации вместо
технического размера; для старого API остаётся отображение `S`/`M`/`L`.

На mobile Account находится в header на menu root, category и product, а не в
содержимом menu root. Он имеет ту же позицию для гостя и вошедшего customer;
оба входа открывают один диалог. Правила уведомлений определяет
[системная feature-нота](../../../docs/40-features/Track-history-and-repeat-order.md).

`aria-live`, `aria-pressed`, именованные кнопки плюс/минус и fieldset делают
изменение конфигурации доступным с клавиатуры и для скринридера. Сетка расширяется
на 768/1024/1280px; длинные названия остаются в layout компонента.
[Источник: ProductDetailScreen](../../src/features/menu/ProductDetailScreen.vue),
[источник: MenuRootScreen](../../src/features/menu/MenuRootScreen.vue).

Данные приходят из `/public/menu`; `menu` store владеет loading/error, `cart`
store — добавлением и объединением конфигураций. [Источники: API](../../src/shared/api/public-menu.api.ts), [menu store](../../src/entities/customer/model/menu.store.ts), [cart store](../../src/entities/customer/model/cart.store.ts).

Состояния загрузки, ошибки и пустого меню образуют компактную композицию страницы:
заголовок, пояснение и индикатор, а для ошибки — человеческое объяснение и
одна кнопка «Повторить». Пустое меню не обещает сроков появления позиций.

Проверки: [MenuPage spec](../../src/pages/MenuPage.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [configuration spec](../../src/features/menu/product-configuration.spec.ts).

Карта раздела: [сценарии](INDEX.md).
