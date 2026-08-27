# Front-office

Вход в контур: [README](README.md). Локальная карта: [docs/INDEX.md](docs/INDEX.md).
Критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-front-office.md).

Следуй корневому `AGENTS.md`, pact skills и DoD front-office.

- Runtime только в `src`: `app -> pages -> widgets -> features -> entities -> shared`.
- Unit specs остаются рядом с runtime; Playwright сценарии приложения — в `tests/e2e`.
- Перед сдачей запускай команды из `package.json` для затронутой области.

Документация описывает сценарии, контракты и проверки; runtime и тесты ищи по
ссылкам из [README](README.md) и [docs/INDEX.md](docs/INDEX.md), а не по
полному обходу каталога.
