# Front-office

Следуй корневому `AGENTS.md`, pact skills и DoD front-office.

- Runtime только в `src`: `app -> pages -> widgets -> features -> entities -> shared`.
- Storybook зависит от runtime и живёт только в `.storybook`; обратный импорт запрещён.
- Unit specs остаются рядом с runtime; Playwright сценарии приложения — в `tests/e2e`.
- Перед сдачей запускай команды из `package.json` для затронутой области.

Навигация: [README](README.md), [docs](docs/INDEX.md).
