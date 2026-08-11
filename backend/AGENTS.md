# Backend: правила работы

- Корневые правила: [`../AGENTS.md`](../AGENTS.md); документация: [docs/INDEX.md](docs/INDEX.md).
- Перед изменением читай соответствующий `_MOC-*`, код и тесты области; перед правкой docs — `codex-documentation-pact`.
- Слои: transport вызывает application; application зависит от domain и портов; adapters реализуют порты; domain не знает NestJS, HTTP или PostgreSQL.
- Типы держи в соседних `*.types.ts`, константы — в `*.constants.ts`; тесты — рядом с runtime-кодом.
- Не меняй HTTP/OpenAPI, команды, миграции или runtime-поведение без явной задачи. После изменения контракта обнови OpenAPI.
- Проверки: `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, `npm run openapi:check`.
