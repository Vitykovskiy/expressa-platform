---
title: Управление каталогом back-office
type: feature
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/pages/MenuPage.vue
  - ../../src/pages/admin/menu/catalog.store.ts
  - ../../src/shared/api/catalog.api.ts
---

# Управление каталогом

`/menu` — активный маршрут только administrator. `catalog.store` начинается в `idle` с пустыми массивами; после первого успешного `load` `MenuPage` считает каталог подтверждённым. Пустой подтверждённый каталог показывает «Категорий пока нет. Добавьте первую категорию», а не ошибку. Store хранит данные, `idle|loading|ready|error`, request error и field errors. Loading показывает `role=status`; ошибка — `role=alert` и «Повторить»; во время запроса контент получает `aria-busy` и `inert`, а повторные действия отключены. Источники этих состояний: [catalog.constants.ts](../../src/pages/admin/menu/catalog.constants.ts), [MenuPage.vue](../../src/pages/MenuPage.vue), [catalog.store.ts](../../src/pages/admin/menu/catalog.store.ts).

Пользователь раскрывает категории и группы опций, открывает management mode, создаёт/редактирует/архивирует категории и товары, меняет порядок, создаёт/редактирует/архивирует группы добавок и варианты, переставляет варианты и сохраняет назначения групп категории. Страница хранит выбранную сущность и открытый диалог; store вызывает `CatalogApi` и обновляет подтверждённые сервером данные. Источники: [MenuPage.vue](../../src/pages/MenuPage.vue), [CatalogApi](../../src/shared/api/catalog.api.ts), [catalog store tests](../../src/pages/admin/menu/catalog.store.spec.ts).

Формы не подтверждают пустые обязательные поля, отрицательные цены или напиток без выбранного размера; активному напитку нужен хотя бы один доступный размер. Ошибки полей от сервера остаются у соответствующей формы и снимаются после изменения поля. Архивирование подтверждает `ConfirmDialog`; cancel очищает черновик и возвращает фокус. Селекты, text fields и switches используют нативную или явно заданную ARIA-семантику, а dialog — bottom sheet до 767px и центрированный 90vh от 768px. Источники: [AddProductDialog.vue](../../src/pages/admin/menu/AddProductDialog.vue), [ModifierGroupEditor.vue](../../src/pages/admin/menu/ModifierGroupEditor.vue), [ConfirmDialog.vue](../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue), [AdminDialog.vue](../../src/shared/ui/admin/admin-dialog/AdminDialog.vue).

Данные и HTTP-пути принадлежат API/store; `MenuPage` не формирует HTTP. Подробный внешний контракт и runtime validation — в [API-интеграции](api-integration-and-errors.md); visual, a11y и responsive состояния menu-компонентов — в [Storybook](../95-testing/storybook.md).
