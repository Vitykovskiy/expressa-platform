# back-office

Следуй корневому [AGENTS.md](../AGENTS.md).

- Вход: [README](README.md); [карта документации](docs/INDEX.md); критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-back-office.md).
- Изменяй только этот автономный Vue-контур; исходные импорты из `front-office` запрещены.
- Runtime-код следует `app -> pages -> widgets -> features -> entities -> shared`.
- `src` содержит только runtime-код.
- Перед приёмкой запускай команды из `package.json` и сверяй документацию с кодом.
