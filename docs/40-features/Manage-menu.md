---
title: Управление меню
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../back-office/docs/30-domains/Catalog-management.md
  - ../../back-office/src/pages/admin/menu/catalog.store.ts
---

# Управление меню

Administrator открывает `/menu`, получает административный каталог и управляет
категориями, товарами, размерами, группами/вариантами модификаторов и связями
категории. Диалоги и редакторы владеют локальными черновиками; store владеет
запросами, ошибками и каноническим каталогом, который перечитывает после
успешной команды. [Assignments editor](../../back-office/src/pages/admin/menu/CategoryModifierAssignments.vue),
[modifier editor](../../back-office/src/pages/admin/menu/ModifierGroupEditor.vue),
[catalog store](../../back-office/src/pages/admin/menu/catalog.store.ts),
[Back-office scenario](../../back-office/docs/30-domains/Catalog-management.md).

Backend проверяет предметные ограничения, архивирует вместо удаления и пишет
audit в той же транзакции. Переупорядочивание требует полный текущий набор
идентификаторов; API доступен только administrator. [Catalog domain](../../backend/docs/30-domains/Catalog.md),
[roles](../../backend/src/catalog/transport/catalog-categories.controller.ts).
