---
title: "ADR-004. Изолированный каталог интерфейса в Storybook"
description: Возврат Storybook как независимого каталога UI клиентов Expressa.
type: adr
area: architecture
status: accepted
owner: root
last_verified: 2026-10-08
sources:
  - ../../../front-office/package.json
  - ../../../back-office/package.json
  - ../../../back-office/.storybook/main.ts
knowledge_role: decision
scope: system
---

# ADR-004. Изолированный каталог интерфейса в Storybook

## Контекст

Проверка UI только через runtime требует API, авторизации и воспроизведения
сценариев. Это не позволяет ревьюеру быстро увидеть полный набор визуальных
состояний компонентов и диалогов.

## Решение

Каждый клиент поддерживает свой Storybook в `.storybook`. Каталог импортирует
runtime-компоненты из `src`, но runtime не импортирует Storybook. Истории
используют статические fixtures и decorators: сеть, API, авторизация и
прохождение пользовательских сценариев не нужны.

В каталог входят атомарные компоненты, feature-компоненты, диалоги и shell с
явными состояниями. Route pages, полные страницы и journey stories не входят:
они требуют навигации вместо прямого выбора состояния.

## Текущее состояние интеграции

Back-office содержит [.storybook/main.ts](../../../back-office/.storybook/main.ts) и команды каталога в [package.json](../../../back-office/package.json). В front-office конфигурации `.storybook` и команд `storybook` / `storybook:build` сейчас нет: [package.json](../../../front-office/package.json). Требование этого ADR для front-office остаётся незакрытым; документационная правка не реализует каталог и не принимает его визуальную полноту.

## Последствия

Storybook — часть каждого клиентского контура и его зависимостей. Наличие
конфигурации и историй не утверждает полноту инвентаризации: её отдельно
подтверждает независимая живая проверка. Историческое решение ADR-004 об
удалении заменено этим текстом.
