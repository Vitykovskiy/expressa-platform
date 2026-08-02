---
title: Definition of Done для UI
description: Критерии приёмки всего Vue UI-кода front-office и back-office.
type: standard
area: quality
status: active
tags: [quality, ui, vue, dod]
updated: 2026-08-01
---

# Definition of Done для UI

Эта нота задаёт gate завершённости UI-задачи и применяется ко всему Vue UI-коду
`front-office` и `back-office`, включая runtime UI и Storybook. Детальные
правила Vue и Vuetify определяет [[Vue-code-style|стиль
Vue-кода]].

## Gate

- Изменение сохраняет границы двух независимых продуктов, `pages`, `shared`,
  `shell` и Storybook по [[20-architecture/ADR/ADR-006-runtime-ui-and-storybook-boundaries|ADR-006]].
- Изменённый Vue/Vuetify-код соответствует
  [[Vue-code-style|стилю Vue-кода]]; истории остаются отдельным
  демонстрационным слоем и импортируют готовый runtime-код.
- Изменённое UI-поведение соответствует
  [[UI-accessibility|требованиям доступности и взаимодействия]].
- Выполнены применимые проверки из
  [[Validation-strategy|стратегии проверки]]: форматирование, lint,
  typecheck, сборка Storybook, истории и браузерная проверка.
- Diff не содержит несвязанных правок, временного кода или отключённых проверок.

## Подтверждение

В отчёте задачи указаны выполненные команды, их результат и непроведённые
проверки с причиной. Невыполненный обязательный пункт gate требует отдельного
зафиксированного решения.
