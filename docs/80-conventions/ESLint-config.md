---
title: "ESLint и форматирование"
type: convention
owner: root
last_verified: 2026-10-21
sources:
  - ../../AGENTS.md
  - ../../package.json
  - ../../.prettierrc.json
  - ../../.prettierignore
  - ../../backend/package.json
  - ../../backend/eslint.config.mjs
  - ../../front-office/package.json
  - ../../front-office/eslint.config.mjs
  - ../../scripts/check-docs.mjs
knowledge_role: implementation
scope: system
updated: 2026-10-21
---

# ESLint и форматирование

Эта нота описывает проверенную конфигурацию на 2026-10-21. Обязательные семантические критерии заданы [общим стандартом](Clean-code.md) и [DoD](Definition-of-Done.md); отсутствие lint-rule не отменяет их. При изменении конфигурации источником фактического выполнения остаётся сам файл.

## Текущие владельцы

| Область                 | Источник                                                                                            | Фактический охват                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Корневое форматирование | [Prettier](../../.prettierrc.json), [ignore](../../.prettierignore), [manifest](../../package.json) | Prettier: 80 колонок, 2 пробела, semicolon, double quotes, trailing commas `all`, LF. Root `format`/`format:check` используют `.`.                                                        |
| Backend lint            | [Конфигурация](../../backend/eslint.config.mjs), [manifest](../../backend/package.json)             | Recommended ESLint/TypeScript, Node globals; ignores `dist/**`, `coverage/**`. Script `lint` передаёт `{src,scripts,test}/**/*.ts`.                                                       |
| Front-office lint       | [Конфигурация](../../front-office/eslint.config.mjs), [manifest](../../front-office/package.json)   | Recommended ESLint/TypeScript/Vue, browser globals для TS/Vue, browser+Node для mjs; Vue block order template/script/style, согласование с Prettier. Script `lint` использует `eslint .`. |
| Front-office format     | [Manifest](../../front-office/package.json)                                                         | `format`/`format:check` включают `src`, `tests` и корневые JS/JSON-конфиги приложения.                                                                                                    |

Back-office manifest, lock-файл и локальный ESLint отсутствуют в текущем checkout. Команды и severity для него не подтверждены. [Технический DoD](Code-Definition-of-Done-back-office.md) и требования новой конфигурации в [Vue style](../40-quality/Vue-code-style.md#форматтер-линтер-и-пустые-строки) остаются обязательной целью; эта нота не объявляет их уже включёнными.

## Выбор команды

До явной пользовательской приёмки действует абсолютное правило [AGENTS](../../AGENTS.md#абсолютное-правило-до-приёмки), после неё работа с тестами также требует прямого запроса. Широкий script, затрагивающий тесты, не становится узким от добавления аргумента. Для задачи выбирают существующий бинарник с явными путями разрешённых файлов; автоисправление не расширяет diff.

Для документации из корня, при установленных зависимостях, существующий форматтер допускает явные Markdown-пути: `./node_modules/.bin/prettier --check docs/80-conventions/*.md`. Используйте список реально изменённых документов, когда остальные файлы каталога не относятся к задаче.

Существующий `node scripts/check-docs.mjs --scope root` проверяет metadata, локальные ссылки, навигацию, reachability, source paths и coverage в корневых docs; также читает структуру tracked вложенных README и корневую достижимость входов контуров. Он не исполняет приложения или тесты. `--self-test` — отдельный тестовый режим, в документационной задаче не запускается. Проверка не валидирует якоря, игнорирует ссылки внутри fenced code и не доказывает смысл утверждений: они проверяются чтением.

## Интерпретация результата

Указывайте точную команду, фактический охват, успех либо ошибку и причину невыполнения. Не выдавайте formatter за доказательство логических блоков, lint за соблюдение SOLID, а typecheck/build за runtime. Известные отсутствующие источники отдельно обозначаются как пробел, без создания нового checker или ослабления существующего. Повтор нужен при изменённом входе или конкретном нерешённом критерии.
