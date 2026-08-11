---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../.storybook/main.ts
  - ../../.storybook/scripts/check-storybook-manifest.mjs
---

# Storybook back-office

Storybook — изолированный каталог runtime UI. Истории из [`.storybook/stories`](../../.storybook/stories/) импортируют компоненты из `src`; runtime не импортирует Storybook. [reference-index.json](../../.storybook/scripts/reference-index.json) содержит нормативные 96 записей, а `storybook:build` сравнивает ID, имя, title и type собранного каталога с этим индексом.

Истории `Orders`, `Availability`, `Settings` и `Users` показывают orphan-компоненты, а не маршруты приложения. `AuthScreen` — исключение: он активный дочерний UI `LoginPage` для `/login` и также имеет stories. Статус экранов закреплён в [неактивных экранах](../30-domains/Inactive-screens.md) и [входе](../30-domains/Authentication-and-role-gates.md).

`test:storybook` исполняет все reference stories и контроль ширин; `test:a11y` запускает Axe для auth, orders, availability, menu, settings, users и shell, исключая color contrast, landmarks, page heading и region; `test:visual` сверяет три PNG-эталона. `test:storybook:screenshots` сохраняет manifest снимков. Источники: [navigation test](../../.storybook/tests/navigation.e2e.ts), [a11y test](../../.storybook/tests/a11y.e2e.ts), [visual test](../../.storybook/tests/visual.e2e.ts).
