---
type: convention
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../.storybook/main.ts
---

# Runtime и Storybook

`src` содержит runtime и colocated unit-specs. `.storybook` содержит истории,
fixtures, preview и проверку манифеста; runtime не импортирует Storybook.
[Источник: конфигурация](../../.storybook/main.ts).

История импортирует runtime-компонент и демонстрирует наблюдаемое состояние, но
не создаёт вторую реализацию. Стабильность ID и сборку проверяет
`npm run storybook:build`; доступность и снимки запускают Playwright-команды.
[Источник: scripts](../../package.json).

Исходник поведения — runtime; Storybook, unit и e2e — доказательства поведения.
Правило цитирования и приоритет источников: [источники](../_sources/README.md).
