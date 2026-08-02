---
title: Definition of Done для UI
description: Критерии готовности UI-кода front-office и back-office.
type: standard
area: quality
status: active
tags: [quality, ui, vue, dod]
updated: 2026-08-02
---

# Definition of Done для UI

Нота задаёт обязательный стандарт для всего UI-кода `front-office` и
`back-office`: runtime-компонентов, экранов, их состояний и историй. Каждый
клиент автономен и владеет собственными UI-компонентами, темой и Storybook по
[[../20-architecture/Client-architecture|архитектуре клиентов]] и
[[../20-architecture/Repository-boundaries|границам приложений]]. Детальные
правила реализации определяет [[Vue-code-style|стиль Vue-кода]].

## Gate

- UI сохраняет автономность клиентов, границы `pages`, `shared`, shell и
  Storybook; истории импортируют готовый runtime UI и остаются
  демонстрационным слоем.
- UI соответствует [[Vue-code-style|стилю Vue-кода]] и
  [[UI-accessibility|требованиям доступности и взаимодействия]].
- Выполнены применимые проверки из [[Validation-strategy|стратегии проверки]]:
  форматирование, lint, typecheck, сборка Storybook, истории и браузерная
  проверка.
- Diff не содержит несвязанных правок, временного кода или отключённых
  проверок.

## Подтверждение

В отчёте задачи указаны выполненные команды, их результат и непроведённые
проверки с причиной. Невыполненный обязательный пункт требует отдельного
зафиксированного решения.
