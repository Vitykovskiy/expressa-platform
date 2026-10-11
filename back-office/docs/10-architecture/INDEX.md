---
title: "Архитектура back-office 2.0"
type: index
owner: back-office
knowledge_role: navigation
scope: back-office
---

# Архитектура back-office 2.0

- [UI ownership](ui-ownership.md): границы темы, состояния и приёмки.
- [Дизайн-система](design-system.md): источники tokens и публичные компоненты.
- [Размещение кода](../80-conventions/code-layout.md): действующие слои.

- [Staff read slice](staff-read-slice.md): session, OTP и защищённое чтение заказов.
- [Availability slice](availability-slice.md): scalar-команды, восстановление и свежесть.
- [Каталог и категории](catalog-categories-slice.md): administrator CRUD/reorder и границы unknown outcome.

Назад к [карте документации](../INDEX.md).

- [Товары и атомарные цены](catalog-products-slice.md): полный product draft, identities, branch/omission/recovery и прежние category lifetimes.
- [Группы добавок и атомарный состав](catalog-modifiers-slice.md): полный aggregate, identities, omissions, отдельный option reorder и неизвестный исход.
- [Связи категории с группами](catalog-associations-slice.md): deliberate full replacement, скрытые архивные связи, strict PUT и readonly recovery.
- [Установка рабочего приложения](pwa-installation.md): manifest, оригинальные иконки, browser-native установка и открытая install/launch-проверка.
