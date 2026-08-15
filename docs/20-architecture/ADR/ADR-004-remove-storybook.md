---
title: Удаление Storybook
description: Завершение использования Storybook в клиентах Expressa.
type: adr
area: architecture
status: accepted
supersedes:
  - ADR-003-local-application-documentation-and-storybook.md
  - front-office ADR-001-runtime-and-storybook-boundaries (часть Storybook)
  - back-office ADR-001-feature-sliced-runtime-and-storybook (часть Storybook)
owner: root
last_verified: 2026-08-15
sources:
  - ../../../front-office/package.json
  - ../../../back-office/package.json
---

# ADR-004. Удаление Storybook

## Контекст

Storybook выполнил задачу каталога UI. Дальнейшая поддержка отдельных
конфигураций, историй и команд не даёт текущей ценности и мешает сопровождению.

## Решение

Storybook удаляется из `front-office` и `back-office`. UI проверяется в runtime
применимыми автоматическими и браузерными проверками. Локальный `test:catalog:e2e`
back-office остаётся runtime E2E с test backend.

## Последствия

Команды и зависимости Storybook больше не поддерживаются. ADR-003 и части
локальных ADR-001 о Storybook сохранены только как история.
