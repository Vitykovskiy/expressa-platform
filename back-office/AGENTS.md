# back-office

Начинайте с [README](README.md): он ведёт к runtime, контракту, тестам и командам. [Карта документации](docs/INDEX.md) содержит текущие сценарии, маршруты и API-границы; [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-back-office.md) определяет приёмку production-кода.

- Изменяй только этот автономный Vue-контур; исходные импорты из `front-office` запрещены.
- Runtime-код следует `app -> pages -> widgets -> features -> entities -> shared`.
- `src` содержит только runtime-код.
- Перед приёмкой запускай команды из `package.json` и сверяй документацию с кодом.
