---
title: ADR-001 runtime-слои и изоляция Storybook
type: adr
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../AGENTS.md
  - ../../.storybook/main.ts
---

# ADR-001: runtime-слои и изоляция Storybook

## Контекст

Код рабочего интерфейса и каталог UI находились рядом, поэтому граница runtime была неочевидна.

## Решение

Runtime следует направлению `app -> pages -> widgets -> features -> entities -> shared`. Административные экраны находятся в `src/pages/admin`, оболочка — в `src/widgets/admin-shell`, общие административные примитивы — в `src/shared/ui/admin`. Все Storybook-артефакты находятся в `.storybook`.

## Последствия

Пути импортов сохраняют границу: Storybook импортирует runtime, но не участвует в его проверках. Проверка `! rg -n 'storybook|\\.stories\\.' src` закрепляет границу.
