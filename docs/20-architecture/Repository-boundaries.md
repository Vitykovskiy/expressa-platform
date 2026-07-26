---
title: Границы репозиториев
description: Ответственность и автономность backend, front-office и back-office.
type: architecture
area: architecture
status: current
tags: [expressa, architecture, repositories]
updated: 2026-07-26
---

# Границы репозиториев

### 2.1. Репозитории

Система состоит из трёх автономных репозиториев:

| Репозиторий | Назначение | Основной стек |
|---|---|---|
| `backend` | API, бизнес-логика, данные, авторизация, аудит | NestJS, TypeScript, PostgreSQL |
| `front-office` | Клиентское мобильное PWA | Vue 3, Vuetify, TypeScript, Vite |
| `back-office` | Рабочее PWA бариста и администратора | Vue 3, Vuetify, TypeScript, Vite |

Каждый репозиторий содержит собственные зависимости, типы, компоненты, конфигурацию, тесты, документацию и конвейер поставки.
