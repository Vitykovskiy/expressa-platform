---
title: "Управление меню"
type: feature
owner: root
last_verified: 2026-10-09
sources:
  - ../50-interfaces/Back-office-UI.md
  - ../30-domain/Catalog-and-menu.md
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
knowledge_role: requirements
scope: system
---

# Управление меню

Administrator получает административный каталог и управляет категориями,
товарами, ценами, группами и вариантами модификаторов и связями категорий.
Сохраняются серверный порядок, архивирование, предметная валидация и аудит.
Актуальная модель цен определена [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md),
точные команды — [API back-office](../50-interfaces/Back-office-API.md).

При редактировании сотрудник сохраняет введённые данные до подтверждённого
результата. Ошибка валидации относится к соответствующему полю;
неоднозначный результат записи требует проверки серверного состояния.
Состояния и права определяет [UI-контракт](../50-interfaces/Back-office-UI.md).

Сценарий не назначает маршрут, диалог, дерево компонентов или store.
Их выбирают заново по [ADR-011](../20-architecture/ADR/ADR-011-back-office-clean-slate.md).
