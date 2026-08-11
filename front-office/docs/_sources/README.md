---
type: sources
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/shared/api/client.ts
---

# Источники

Факт реализации подтверждает `src`; внешний HTTP-контракт —
`contracts/openapi.json`; сценарий — рядом лежащий spec или `tests/e2e`;
команду и окружение — `package.json` и конфигурация. При расхождении приоритет
имеет код для текущего поведения и OpenAPI для внешнего контракта.
[Источники: OpenAPI](../../contracts/openapi.json), [scripts](../../package.json).

Каждый фактический блок документации заканчивается ссылкой на первичный источник;
метаданные `sources` его не заменяют. Секреты и значения локального окружения
в ноты не вносятся. [Источник: environment](../../src/shared/config/environment.ts).
