---
type: convention
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../.storybook/main.ts
---

# Runtime и Storybook

`src` содержит runtime и colocated unit-specs. `.storybook` содержит истории,
fixtures и preview; runtime не импортирует Storybook.
[Источник: конфигурация](../../.storybook/main.ts).

История импортирует runtime-компонент и демонстрирует наблюдаемое состояние, но
не создаёт вторую реализацию. Storybook — негейтирующий каталог UI-состояний;
его сборка доступна через `npm run storybook:build`.
[Источник: scripts](../../package.json).

Исходник поведения — runtime; unit и e2e проверяют поведение приложения.
Правило цитирования и приоритет источников: [источники](../_sources/README.md).
