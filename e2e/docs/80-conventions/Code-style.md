---
title: Code Style для standalone E2E
description: Соглашения Playwright, TypeScript и POM для E2E-набора Expressa.
type: convention
area: e2e
status: active
tags: [code-style, e2e, playwright, typescript]
related:
  - Definition-of-Done.md
  - ../20-architecture/ADR/ADR-001-standalone-e2e-architecture.md
---

# Code Style для standalone E2E

Этот документ — нормативный источник для Playwright-спецификаций, Page и Component Objects, fixtures, тестовых данных и вспомогательных модулей в `e2e`. UI-only границу задаёт [ADR-001](../20-architecture/ADR/ADR-001-standalone-e2e-architecture.md).

## Роли файлов

- Spec владеет пользовательским сценарием и его проверками.
- Page/Component Object владеет локаторами, ожиданиями готовности и UI-действиями.
- Fixture собирает зависимости сценария, не дублируя UI-механику.
- `support/data` хранит предметные данные и генераторы, `support/config` — чтение и проверку E2E-окружения.
- Взаимодействие с приложением выполняется только через UI Playwright. API, БД, Web Storage, прямое изменение сети и иной обход интерфейса не используются.

## TypeScript и структура

- Используется строгий TypeScript; `any` не применяется. Публичные входы, результаты чтения и предметные данные типизируются явно.
- Файл имеет одну основную роль: исполняемая логика, константы либо типы. Повторяемые UI-тексты, пути, селекторы и предметные значения выносятся в именованные константы.
- Каждый новый или изменяемый Page/Component Object состоит из `<subject>.constants.ts`, `<subject>.types.ts` и `<subject>.page.ts` либо `<subject>.component.ts`.
- В `*.constants.ts` размещаются экспортируемые UI-тексты, пути, селекторы и декларативные значения; в `*.types.ts` — экспортируемые `type` и `interface`. Класс объекта импортирует их из соседних файлов.

```text
e2e/
├── components/<area>/<subject>.constants.ts
├── components/<area>/<subject>.types.ts
├── components/<area>/<subject>.component.ts
├── pages/<area>/<subject>.constants.ts
├── pages/<area>/<subject>.types.ts
├── pages/<area>/<subject>.page.ts
├── fixtures/test.ts
├── specs/<area>/<scenario>.spec.ts
└── support/{config,data}/
```

## Спецификации и объекты

- Имена сценариев, `test.step` и UI-ассерты пишутся по-русски и описывают наблюдаемое пользовательское поведение.
- Spec вызывает предметные методы Page/Component Objects. Он не создаёт локаторы, не повторяет ожидания готовности и не содержит технические клики, уже инкапсулированные объектом.
- Локаторы объявляются полями класса и используют роли, доступное имя, подпись, `data-testid` либо стабильный идентификатор. Структурный CSS-селектор допустим, если устойчивого UI-контракта нет.
- UI-действие ожидает наблюдаемый результат через web-first `expect`. Фиксированные задержки не используются.
- Объект представляет экран, устойчивую область экрана либо переиспользуемый компонент. Он не содержит бизнес-правила приложения, подготовку через API и логику другого экрана.
- Запрещены `test.only`, `test.skip`, `describe.only`, отладочные паузы и временные обходы без отдельного назначения.

## Fixtures, данные и окружение

- Spec импортирует расширенные Playwright fixtures из `fixtures/test.ts`; это единая публичная точка для `test` и `expect`.
- Тестовые данные имеют предметное имя, находятся в `support/data` и получают уникальность от идентификатора запуска, а не от глобального изменяемого состояния.
- `support/config` проверяет обязательные `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL`. Учётные данные и другие секреты не размещаются в spec и документации.
