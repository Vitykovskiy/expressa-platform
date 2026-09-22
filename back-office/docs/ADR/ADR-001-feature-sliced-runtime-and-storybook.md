---
title: ADR-001 runtime-слои и изоляция Storybook
type: adr
owner: back-office
last_verified: 2026-09-22
sources:
  - ../../AGENTS.md
  - ../../.storybook/main.ts
  - ../../.storybook/preview.ts
  - ../../.storybook/stories/
---

# ADR-001: runtime-слои и изоляция Storybook

## Контекст

Код рабочего интерфейса находился в нескольких слоях, поэтому граница runtime была неочевидна.

## Решение

Runtime следует направлению `app -> pages -> widgets -> features -> entities -> shared`. Административные экраны находятся в `src/pages/admin`, оболочка — в `src/widgets/admin-shell`, общие административные примитивы — в `src/shared/ui/admin`.

## Storybook

Storybook и его истории находятся в `.storybook` вне `src`,
чтобы runtime оставался свободен от каталоговых артефактов. Истории используют
только статические fixture-данные и прямые props/emits: API, авторизация и
пользовательские маршруты для просмотра состояний не требуются. В каталог входят
изолируемые компоненты, элементы, диалоги, prop-driven screen-композиции и части
оболочки; route pages и контейнеры, которым нужны API или пользовательские flows,
исключены.

## Последствия

Пути импортов сохраняют направление между runtime-слоями. Storybook не добавляет
API-зависимостей в компоненты и запускается командами из [README](../../README.md#каталог-интерфейса).
