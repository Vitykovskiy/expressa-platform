# Front-office

Следуй корневому [AGENTS.md](../AGENTS.md).

- Вход в контур: [README](README.md). Локальная карта: [docs/INDEX.md](docs/INDEX.md). Критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-front-office.md).
- Runtime только в `src`: `app -> pages -> widgets -> features -> entities -> shared`.
- Unit specs остаются рядом с runtime; Playwright сценарии приложения — в `tests/e2e`.
- Перед сдачей запускай команды из `package.json` для затронутой области.
- Документация описывает сценарии, контракты и проверки; runtime и тесты ищи по ссылкам из [README](README.md) и [docs/INDEX.md](docs/INDEX.md).
