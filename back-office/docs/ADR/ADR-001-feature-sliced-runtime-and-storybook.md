---
title: ADR-001 runtime-слои и изоляция Storybook
type: adr
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../AGENTS.md
---

# ADR-001: runtime-слои и изоляция Storybook

> Runtime-слои остаются действующим решением. Storybook-часть ниже сохранена как история и заменена [ADR-004](../../../docs/20-architecture/ADR/ADR-004-remove-storybook.md).

## Контекст

Код рабочего интерфейса находился в нескольких слоях, поэтому граница runtime была неочевидна.

## Решение

Runtime следует направлению `app -> pages -> widgets -> features -> entities -> shared`. Административные экраны находятся в `src/pages/admin`, оболочка — в `src/widgets/admin-shell`, общие административные примитивы — в `src/shared/ui/admin`.

## Историческая часть: Storybook

До [ADR-004](../../../docs/20-architecture/ADR/ADR-004-remove-storybook.md) каталог UI находился в `.storybook`; его истории импортировали runtime-код.

## Последствия

Пути импортов сохраняют направление между runtime-слоями. Историческая граница Storybook не участвует в текущих проверках.
