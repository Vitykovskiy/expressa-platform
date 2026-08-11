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

| Область | Действия, состояния и видимый результат | Источник |
|---|---|---|
| Меню | загрузка, ошибка с «Повторить», пустое меню, предупреждение о закрытом приёме | [MenuPage](../../src/pages/MenuPage.vue) |
| Навигация | категория, товар, возврат и browser history меняют root/category/product; floating-корзина скрыта в товаре | [MenuFlow](../../src/features/menu/MenuFlow.vue) |
| Сетка | категория без товаров показывает статус; карточка товара открывает детали | [group](../../src/features/menu/MenuGroupScreen.vue), [card](../../src/features/menu/ProductCard.vue) |
| Товар | вариант напитка, опции, количество и итог меняются до submit; недопустимая конфигурация не отправляется | [detail](../../src/features/menu/ProductDetailScreen.vue) |

`aria-live`, `aria-pressed`, именованные кнопки плюс/минус и fieldset делают
изменение конфигурации доступным с клавиатуры и для скринридера. Сетка расширяется
на 768/1024/1280px; длинные названия остаются в layout компонента.
[Источник: ProductDetailScreen](../../src/features/menu/ProductDetailScreen.vue),
[источник: MenuRootScreen](../../src/features/menu/MenuRootScreen.vue).

Данные приходят из `/public/menu`; `menu` store владеет loading/error, `cart`
store — добавлением и объединением конфигураций. [Источники: API](../../src/shared/api/public-menu.api.ts), [stores](../../src/entities/customer/model).

Проверки: [MenuPage spec](../../src/pages/MenuPage.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [configuration spec](../../src/features/menu/product-configuration.spec.ts).
