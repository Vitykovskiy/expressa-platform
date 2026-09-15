# Front-office

Следуй корневому [AGENTS.md](../AGENTS.md).

- Корневое абсолютное правило имеет высший приоритет: до явной приёмки пользователем не создавай, не изменяй и не запускай автоматизированные тесты. До приёмки разрешены только форматирование, lint, typecheck, build и статическая проверка OpenAPI-контракта при её применимости.
- Вход в контур: [README](README.md). Локальная карта: [docs/INDEX.md](docs/INDEX.md). Критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-front-office.md).
- Runtime только в `src`: `app -> pages -> widgets -> features -> entities -> shared`.
- Unit specs остаются рядом с runtime; пользовательские потоки принимаются вручную в работающем приложении.
- Перед приёмкой выполняй только применимые нетестовые проверки этой области.
- Документация описывает сценарии, контракты и проверки; runtime и тесты ищи по ссылкам из [README](README.md) и [docs/INDEX.md](docs/INDEX.md).
