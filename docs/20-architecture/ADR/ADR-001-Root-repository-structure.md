---
title: Корневая структура репозитория
description: Размещение трёх приложений, standalone E2E-пакета, общей документации и бэклога в едином репозитории Expressa.
type: adr
area: architecture
status: accepted
tags: [expressa, architecture, repository, documentation]
updated: 2026-08-25
source_mode: normative
owner: root
last_verified: 2026-08-11
sources:
  - ../../../backend/package.json
  - ../../../front-office/package.json
  - ../../../back-office/package.json
  - ../../../e2e/package.json
requirements: [TR-REP-001, TR-REP-002, TR-REP-003]
repositories: [backend, front-office, back-office, e2e]
related:
  [
    "[../Repository-boundaries](../Repository-boundaries.md)",
    "[../../10-overview/Backlog](../../10-overview/Backlog.md)",
    "[../../00-meta/How-to-use-this-vault](../../00-meta/How-to-use-this-vault.md)",
  ]
---

# ADR-001. Корневая структура репозитория

## Контекст

Expressa состоит из трёх автономно собираемых приложений: backend, front-office и back-office, и standalone npm-пакета `e2e`. Общие требования, архитектура и бэклог уже находятся в `docs/` текущего репозитория. Размещение контуров в отдельных соседних репозиториях создало бы дополнительный репозиторий для документации и усложнило бы атомарные изменения API, клиентов и связанных нот.

## Решение

Текущий репозиторий `expressa` является корневым репозиторием всей системы. Backend, front-office, back-office и `e2e` размещаются в его каталогах без вложенных Git-репозиториев. Общая документация и единственный бэклог остаются в корневом `docs/` и не копируются в каталоги приложений.

Каждое приложение сохраняет собственные зависимости, lock-файл, конфигурацию окружения, сборку, Docker-образ и тесты. Приложения не импортируют код друг друга; клиенты взаимодействуют с backend через HTTP API и собственные снимки OpenAPI-контракта.

Пакет `e2e` имеет собственные зависимости, lock-файл, правила и документацию. Он не запускает приложения и взаимодействует с подготовленными front-office и back-office только через Playwright UI; API, база данных, хранилище браузера и сетевые обходы не являются его интерфейсом.

## Целевая структура

```text
expressa/
├── backend/
│   ├── src/
│   │   ├── platform/
│   │   ├── modules/
│   │   └── shared/
│   ├── migrations/
│   ├── test/
│   │   ├── integration/
│   │   ├── e2e/
│   │   └── fixtures/
│   └── scripts/
├── front-office/
│   ├── .storybook/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/
│   │   ├── features/
│   │   ├── entities/
│   │   └── shared/
│   │       ├── api/
│   │       ├── ui/
│   │       ├── lib/
│   │       └── config/
│   └── e2e/
├── back-office/
│   ├── .storybook/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/
│   │   ├── features/
│   │   ├── entities/
│   │   └── shared/
│   │       ├── api/
│   │       ├── ui/
│   │       ├── lib/
│   │       └── config/
│   └── e2e/
├── e2e/
│   ├── components/
│   ├── fixtures/
│   ├── pages/
│   ├── specs/
│   ├── support/
│   └── docs/
├── docs/
│   ├── 00-meta/
│   ├── 10-overview/
│   │   └── backlog/
│   ├── 20-architecture/
│   │   └── ADR/
│   ├── 30-domain/
│   ├── 40-features/
│   ├── 50-interfaces/
│   ├── 70-deployment/
│   ├── 80-conventions/
│   ├── 90-agents/
│   ├── 95-testing/
│   ├── _journal/
│   └── _sources/
├── AGENTS.md
├── README.md
└── .gitignore
```

Базовый каркас пустых каталогов фиксируется файлами `.gitkeep`, которые удаляются при появлении рабочих файлов. Модульные тесты размещаются рядом с тестируемым кодом. Storybook-конфигурация принадлежит соответствующему клиенту, а файлы `*.stories.ts` размещаются рядом с UI-компонентами.

## Последствия

- Изменение backend, клиентов, документации и бэклога может выполняться одним коммитом и приниматься одним pull request.
- CI запускает проверки только затронутых приложений и общие проверки документации.
- Версии, сборки и Docker-образы приложений остаются независимыми.
- Разделение приложений обеспечивается границами каталогов, API-контрактом и проверками импортов, а не отдельными Git-репозиториями.
- `e2e` выполняется отдельно против подготовленной среды и сохраняет UI-only границу будущего Q-E2E.

## Отклонённый вариант

Четыре соседних репозитория — отдельный репозиторий документации и три репозитория приложений — отклонены: общая документация уже является частью текущего корневого репозитория, а дополнительное разделение усложняет синхронные изменения без пользы для MVP.
