# Backend: правила работы

Следуй корневому [AGENTS.md](../AGENTS.md).

- Корневое абсолютное правило имеет высший приоритет: до явной приёмки пользователем не создавай, не изменяй и не запускай автоматизированные тесты. До приёмки разрешены только форматирование, lint, typecheck, build и, при изменении HTTP-контракта, статическая проверка OpenAPI.
- Вход области: [README.md](README.md); документация: [docs/INDEX.md](docs/INDEX.md); критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-backend.md).
- Слои: transport вызывает application; application зависит от domain и портов; adapters реализуют порты; domain не знает NestJS, HTTP или PostgreSQL.
- Типы держи в соседних `*.types.ts`, константы — в `*.constants.ts`; тесты — рядом с runtime-кодом.
- Не меняй HTTP/OpenAPI, команды, `schema.sql` или runtime-поведение без явной задачи. После изменения контракта обнови OpenAPI. Local/test/development базы пересоздаются из `schema.sql` и seed; миграций и backfill нет.
- Нетестовые проверки: форматирование, `npm run lint`, `npm run typecheck`, `npm run build` и `npm run openapi:check` при изменении HTTP-контракта.
