# Backend: правила работы

Следуй корневому [AGENTS.md](../AGENTS.md).

- Вход области: [README.md](README.md); документация: [docs/INDEX.md](docs/INDEX.md); критерии готовности: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-backend.md).
- Слои: transport вызывает application; application зависит от domain и портов; adapters реализуют порты; domain не знает NestJS, HTTP или PostgreSQL.
- Типы держи в соседних `*.types.ts`, константы — в `*.constants.ts`; тесты — рядом с runtime-кодом.
- Не меняй HTTP/OpenAPI, команды, `schema.sql` или runtime-поведение без явной задачи. После изменения контракта обнови OpenAPI. Local/test/development базы пересоздаются из `schema.sql` и seed; миграций и backfill нет.
- Проверки: `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, `npm run openapi:check`.
