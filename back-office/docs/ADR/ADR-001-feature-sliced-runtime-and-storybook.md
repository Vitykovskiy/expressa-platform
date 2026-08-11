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

Код рабочего интерфейса, каталог UI и его проверки находились рядом, поэтому граница runtime была неочевидна.

## Решение

Runtime следует направлению `app -> pages -> widgets -> features -> entities -> shared`. Административные экраны находятся в `src/pages/admin`, оболочка — в `src/widgets/admin-shell`, общие административные примитивы — в `src/shared/ui/admin`. Все Storybook-артефакты находятся в `.storybook`.

## Последствия

Пути импортов и Playwright-конфигурация поддерживают то же runtime-поведение; titles, exports и IDs историй сохраняются. Проверка `! rg -n 'storybook|\\.stories\\.' src` закрепляет границу.
