# E2E Expressa

Следуй корневому [AGENTS.md](../AGENTS.md), обязательным pact skills и локальным правилам E2E.

- UI-only standalone-набор проверяет отдельно запущенные front-office и back-office через Playwright. API, БД, Web Storage, прямое изменение сети и запуск приложений из пакета не используются.
- Обязательные URL окружения: `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL`. Они читаются и проверяются в `support/config`.
- Spec выражает пользовательский сценарий. Локаторы, UI-действия и ожидания принадлежат Page/Component Objects. Все specs, имена шагов и UI-ассерты пишутся по-русски.
- Новый или изменяемый объект состоит из `<subject>.constants.ts`, `<subject>.types.ts` и `<subject>.page.ts` либо `<subject>.component.ts`.
- Fixtures импортируются из `fixtures/test.ts`; предметные данные размещаются в `support/data`.
- Сценарии, POM-объекты и данные создавай только при явном включении предметной области в задачу. До этого каталог `docs/95-testing/scenarios` остаётся пустым.

Перед сдачей изменений запускай применимые команды из `package.json`: `npm run lint`, `npm run format:check`, `npm run typecheck:e2e`, `npm run e2e:boundaries`. Полные E2E-сценарии запускай только при предоставленных URL.

Навигация: [README](README.md), [документация](docs/INDEX.md), [DoD](docs/80-conventions/Definition-of-Done.md), [Code Style](docs/80-conventions/Code-style.md).
