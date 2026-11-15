---
title: "ESLint и форматирование"
type: convention
owner: root
last_verified: 2026-11-15
sources:
  - ../../AGENTS.md
  - ../../package.json
  - ../../.prettierrc.json
  - ../../.prettierignore
  - ../../backend/package.json
  - ../../backend/eslint.config.mjs
  - ../../front-office/package.json
  - ../../front-office/eslint.config.mjs
  - ../../back-office/package.json
  - ../../back-office/eslint.config.mjs
  - ../../scripts/eslint/index.mjs
  - ../../scripts/eslint/policy.constants.mjs
  - ../../scripts/eslint/declaration-placement.mjs
  - ../../scripts/eslint/layer-imports.mjs
  - ../../scripts/check-docs.mjs
knowledge_role: implementation
scope: system
updated: 2026-11-15
---

# ESLint и форматирование

Конфигурации трёх приложений проверены на 2026-11-15. Они автоматизируют
синтаксическую часть [чистого кода](Clean-code.md) и контурных DoD;
семантические критерии остаются обязательными на ревью.
Наличие правила не означает, что весь существующий код уже ему соответствует.

## Владельцы настроек

| Область             | Источник                                                                                                 | Ответственность                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Форматирование      | [Prettier](../../.prettierrc.json), [ignore](../../.prettierignore)                                      | 80 колонок, 2 пробела, semicolons, double quotes, trailing commas `all`, LF. Настройки Expressa сохранены. |
| Общая lint-политика | [Правила](../../scripts/eslint/policy.constants.mjs), [локальный plugin](../../scripts/eslint/index.mjs) | Общие настройки и две узкие AST-проверки; только dev tooling, без зависимостей от runtime приложений.      |
| Backend             | [ESLint](../../backend/eslint.config.mjs), [manifest](../../backend/package.json)                        | ESLint/TypeScript recommended, Node globals, NestJS metadata и собственные границы слоёв.                  |
| Front-office        | [ESLint](../../front-office/eslint.config.mjs), [manifest](../../front-office/package.json)              | ESLint/TypeScript/Vue recommended, browser globals, слои `app/pages/widgets/features/entities/shared`.     |
| Back-office         | [ESLint](../../back-office/eslint.config.mjs), [manifest](../../back-office/package.json)                | ESLint/TypeScript/Vue recommended; структура `app/layouts/modules/shared`, точные session-исключения.      |

Каждое приложение устанавливает собственные pinned lint-зависимости и использует
их локальные версии. Общий plugin импортирует только Node built-ins и соседние
файлы tooling; приложения не импортируют конфигурацию или исходники друг друга.
`eslint-config-prettier` находится перед явными правилами читаемости:
заданные `@stylistic/no-multiple-empty-lines` больше не отключаются последним
Prettier override. Кавычки, отступы и перенос выражений принадлежат Prettier.

## Что проверяется автоматически

Если ниже не указано иначе, severity — `error`. Для Vue component scopes
действует узкая адаптация unsafe severity, описанная ниже.
Существующие recommended-правила
сохраняются, включая `no-explicit-any` и проверки неиспользуемого кода.

- Ветвления: `curly: all`, `@stylistic/brace-style` без однострочных блоков,
  `no-nested-ternary`, `no-var`, `prefer-const`.
- Избыточность: `@typescript-eslint/no-empty-function` с допустимыми
  конструкторами, `no-inferrable-types`, `no-unnecessary-type-constraint`,
  а в типизированной области — `no-duplicate-type-constituents` и
  `no-redundant-type-constituents`.
- Подавление типов: `ban-ts-comment` запрещает `@ts-ignore` и `@ts-nocheck`;
  `@ts-expect-error` требует описания. Содержательность причины проверяют на ревью.
- Асинхронность и типы: `no-floating-promises`, `no-misused-promises`,
  `no-unsafe-assignment`, `no-unsafe-argument`, `no-unsafe-return`,
  `no-unsafe-call`, `no-unsafe-member-access`, `switch-exhaustiveness-check`,
  `prefer-readonly`, `consistent-type-imports` в типизированной области.
- Пустые строки: `@stylistic/padding-line-between-statements` разделяет
  группы импортов/объявлений, функции, управляющие блоки и `return`;
  соседние импорты и объявления могут идти подряд.
  `@stylistic/no-multiple-empty-lines`: `max: 1`, `maxBOF: 0`, `maxEOF: 0`.
  Семантические группы следуют [Vue style](../40-quality/Vue-code-style.md#форматтер-линтер-и-пустые-строки).
- `max-depth: 3` и `max-nested-callbacks: 3` имеют severity `warn`.
  Это выбранные сигналы для ревью KISS, а не требование дробить любой алгоритм.

Back-office дополнительно сохраняет прежний `no-non-null-assertion: error`.
Для остальных приложений новый универсальный запрет `!`, обязательные
аннотации очевидных return types, префиксы приватных полей и порядок членов
Angular-класса не вводятся.

### Vue 3

`vue/block-order` задаёт `template/script/style`, `component-api-style` —
`script-setup`, `block-lang` — TypeScript для script. `define-props-declaration`
и `define-emits-declaration` требуют type-based contracts.
`no-mutating-props`, `no-side-effects-in-computed-properties`,
`no-watch-after-await`, `no-lifecycle-after-await` включены явно.
Recommended Vue также проверяет наличие ключей и недопустимый `v-if` вместе с
`v-for`. Семантическая устойчивость ключа, cleanup ресурса, узость контракта,
доступность и актуальность асинхронного результата требуют ревью.

### Размещение деклараций

`expressa/declaration-placement` проверяет runtime `src`:

- Именованные `type`, `interface`, `enum` — в `*.types.ts`; ambient `.d.ts`
  допустимы. Классы DTO и NestJS-модули остаются runtime-классами.
- `const` уровня модуля с доказуемо статическими данными — в `*.constants.ts`.
  Распознаются литералы, статические template literals, массивы/объекты из
  таких значений, простые унарные операции, `as`/`satisfies`, встроенный
  нешадоуированный `Object.freeze` над такими данными.
- Локальные алгоритмические значения, функции, вызовы factories/composables,
  router/provider composition и неизвестные инициализаторы не переносятся.
  Для SFC проверка констант пропускается: `script setup` исполняется на экземпляр,
  а AST сам по себе не доказывает возможность выноса. Именованные типы SFC
  проверяются. Полнота размещения констант остаётся предметом ревью.

Правило ничего не перемещает автоматически и не изменяет области жизни значений.

### Направление импортов

`expressa/layer-imports` обрабатывает import, export-from, literal dynamic import
и TS import types. Относительные пути и `@/` нормализуются; `.js`/`.ts`
расширения снимаются для сопоставления. Другие aliases, вычисляемые dynamic
imports, CommonJS `require`, runtime-циклы и транзитивные зависимости эта
проверка не разрешает и не доказывает.

- Front-office: нижний слой не импортирует верхний в последовательности
  `app -> pages -> widgets -> features -> entities -> shared`.
- Backend: domain не импортирует application/transport/adapters;
  application — transport/adapters. Domain также не импортирует `@nestjs/*`,
  `pg`, `express`, `axios`, `undici`, `web-push` и перечисленные в политике
  Node I/O-модули. Это ограниченная статическая проверка импортов,
  не доказательство отсутствия любого I/O или service locator.
- Back-office: shared не импортирует app/layouts/modules; layouts — только
  собственные файлы и shared, без HTTP-владельца `shared/api` и его файлов,
  а также без `.store`, `.api`, `native-*` файлов;
  module — свои файлы и shared. Сохранены точные существующие исключения:
  `modules/auth/useAuthEntry.ts` импортирует `useSessionStore` из session store;
  `modules/users/UsersRoute.types.ts` — только тип `StaffSession`;
  `modules/notifications/notifications.store.ts` — только тип `LogoutProofSupplier`
  из session types. Session не получает обратного исключения.
- В каждом приложении запрещены прямые импорты файлов другого контура.
  Общие root dev-tool файлы не являются runtime другого приложения.

## Типизированная область и ограничения

| Приложение   | Runtime scope                                      | TypeScript project                                                    |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| Backend      | `src/**/*.ts`, кроме `*.spec.ts`/`*.test.ts`       | `tsconfig.json`, с `experimentalDecorators` и `emitDecoratorMetadata` |
| Front-office | `src/**/*.{ts,vue}`, кроме `*.spec.ts`/`*.test.ts` | `tsconfig.app.json`                                                   |
| Back-office  | `src/**/*.{ts,vue}`, кроме `*.spec.ts`/`*.test.ts` | `tsconfig.json`                                                       |

В Vue используется `vue-eslint-parser` из recommended-конфигурации и делегация
script в `typescript-eslint`, с `extraFileExtensions: [".vue"]`.
Конфиги, scripts и файлы вне этих runtime scopes остаются под нетипизированными
recommended/readability rules. Это явная область, а не fallback при parser error.
В NestJS `consistent-type-imports` учитывает decorator metadata: значения
constructor injection не требуется механически заменять на `import type`.

ESLint использует TypeScript program, а `vue-tsc` — Vue-aware обработку.
TypeScript ESLint не разрешает все типы `.vue` imports и component refs;
жёсткие unsafe errors в обычной композиции Vue были бы ложными срабатываниями.
В отличие от полного отключения пяти правил в
[upstream Vue config](https://github.com/vuejs/eslint-config-typescript/blob/main/src/internals.ts),
здесь они остаются видимыми с узкой адаптацией severity:

- В runtime `src/**/*.vue` обоих клиентов пять правил `no-unsafe-argument`,
  `no-unsafe-assignment`, `no-unsafe-return`, `no-unsafe-call`,
  `no-unsafe-member-access` имеют severity `warn`.
- Только в `front-office/src/main.ts` и `back-office/src/app/bootstrap.ts`
  `no-unsafe-argument` — `warn`, для `createApp(App)`.
- Только в `src/app/router.ts` каждого клиента `no-unsafe-assignment` — `warn`,
  для records с компонентами. Остальные unsafe rules в этих TS-файлах — `error`.
- В остальных runtime TS, включая API/DTO/mappers/stores, все пять правил —
  `error`. Backend не получает этих Vue overrides. Новые component-owning
  TS-файлы не получают исключений автоматически: расширение требует
  подтверждённого ограничения и ревью владельца политики.

Эти предупреждения смешивают возможную реальную unsafety с неполными типами
компонентов; ESLint не умеет надёжно разделить их в данных scopes.
Они требуют ревью и независимого `vue-tsc`, а не механических casts или
runtime-shims. Unsafe операция внутри SFC остаётся предупреждением;
полного error gate для всех Vue-операций эта конфигурация не обещает.
Async, union, readonly и остальные typed rules сохраняют прежнюю severity.

## Выбор команды и состояние внедрения

До явной приёмки действует абсолютное правило
[AGENTS](../../AGENTS.md#абсолютное-правило-до-приёмки); после неё работа с тестами
также требует прямого запроса. Широкий script не сужается добавлением аргумента.
Существующие `lint` scripts backend и front-office могут охватывать test-файлы;
для текущего нетестового среза из каталога приложения использован локальный
бинарник:

```sh
./node_modules/.bin/eslint src --ignore-pattern '**/*.spec.ts' --ignore-pattern '**/*.test.ts'
```

Для back-office текущий `lint` также включает существующие `vite.config.ts`,
`vite.config.constants.ts`, `eslint.config.mjs`. Конфигурация получает правила
напрямую через `COMMON_RULES`; промежуточного re-export файла нет.
Изменённые tooling-файлы форматируются явными путями через существующий root
Prettier; root `format`/`format:check` используют `.` и не подходят для узкой
проверки текущего изменения. Front-office `format` включает `tests`,
а `format:check` — `src` и корневые JS/JSON-конфиги приложения.

Исходный нетестовый lint runtime прошёл во всех трёх приложениях.
Новые правила выявили нарушения в ранее существующем коде; общий lint после
включения строгой политики не объявляется зелёным. Runtime не переписывался
массово, production diagnostics не спрятаны ignores/disables.
Типы проверены существующим `npm run typecheck` каждого приложения.
Детальные команды, exit codes и счётчики принадлежат отчёту конкретной задачи,
поскольку меняются вместе с checkout. Автоматизированные тесты не запускались.

## Граница автоматизации

SOLID O/L/I, связность ответственности, один владелец знания по DRY,
содержательный KISS, правильная валидация внешних данных и сохранение контрактов
не сводятся к syntax checks. Отсутствие lint-rule не отменяет
[DoD](Definition-of-Done.md). Angular selectors/signals/OnPush, Angular lifetime
и RxJS assumptions, blanket ban `return undefined` и formatter-настройки
референсного Barsim не перенесены: они не соответствуют действующим контрактам
NestJS/Vue/Expressa.

Указывайте точный охват, успех/ошибку и причину невыполнения каждой проверки.
Formatter не доказывает логические группы, lint — SOLID, typecheck — runtime.
Для metadata/локальных ссылок существует `node scripts/check-docs.mjs --scope root`;
он не исполняет приложение, не проверяет смысл утверждений и якоря.
`--self-test` — отдельный тестовый режим; в этой задаче он запрещён.
