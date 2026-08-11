---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../.storybook/main.ts
---

# Storybook back-office

Storybook — изолированный каталог UI для ручного просмотра. Истории из [`.storybook/stories`](../../.storybook/stories/) импортируют компоненты из `src`; runtime не импортирует Storybook. `storybook:build` проверяет, что каталог собирается.

Истории `Orders`, `Availability`, `Settings` и `Users` показывают orphan-компоненты, а не маршруты приложения. `AuthScreen` — исключение: он активный дочерний UI `LoginPage` для `/login` и также имеет stories. Статус экранов закреплён в [неактивных экранах](../30-domains/Inactive-screens.md) и [входе](../30-domains/Authentication-and-role-gates.md).

Каталог не является тестовой проверкой и не хранит визуальные эталоны. Runtime проверяется командами из [раздела проверок](README.md).
