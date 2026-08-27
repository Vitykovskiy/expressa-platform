# Backend: правила работы

- Вход области: [README.md](README.md); корневые правила: [`../AGENTS.md`](../AGENTS.md); документация: [docs/INDEX.md](docs/INDEX.md); критерии готовности кода: [Definition of Done](../docs/80-conventions/Code-Definition-of-Done-backend.md).
- Перед изменением читай локальный `INDEX.md`, тематический `_MOC-*` при наличии, код и тесты области; перед правкой docs — `codex-documentation-pact`.
- Слои: transport вызывает application; application зависит от domain и портов; adapters реализуют порты; domain не знает NestJS, HTTP или PostgreSQL.
- Типы держи в соседних `*.types.ts`, константы — в `*.constants.ts`; тесты — рядом с runtime-кодом.
- Не меняй HTTP/OpenAPI, команды, миграции или runtime-поведение без явной задачи. После изменения контракта обнови OpenAPI.
- Проверки: `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, `npm run openapi:check`.
