---
title: Границы приложений
description: Ответственность и автономность backend, front-office и back-office внутри корневого репозитория.
type: architecture
area: architecture
status: current
tags: [expressa, architecture, repositories]
updated: 2026-08-01
---

# Границы приложений

### 2.1. Каталоги приложений

Текущий репозиторий `expressa` является корневым репозиторием системы и содержит общую документацию в `docs/`. Код размещается в трёх автономно собираемых каталогах:

| Каталог | Назначение | Основной стек |
|---|---|---|
| `backend` | API, бизнес-логика, данные, авторизация, аудит | NestJS, TypeScript, PostgreSQL |
| `front-office` | Клиентское мобильное PWA | Vue 3, Vuetify, TypeScript, Vite |
| `back-office` | Рабочее PWA бариста и администратора | Vue 3, Vuetify, TypeScript, Vite |

Каждое приложение содержит собственные зависимости, типы, компоненты, конфигурацию, тесты и конвейер поставки. Общая документация и бэклог хранятся только в корневом `docs/`. Полная структура зафиксирована в [[ADR/ADR-001-Root-repository-structure|ADR-001]].
