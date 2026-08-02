---
title: Карта документации front-office
description: Навигация по текущему устройству клиентского приложения Expressa.
type: index
area: front-office
status: current
tags: [expressa, front-office, navigation]
updated: 2026-08-01
---

# Карта документации front-office

Front-office — автономный Vue-клиент для пользовательских сценариев Expressa. Базовая инициализация находится в [исходном коде приложения](../src/app/).

- Клиентское приложение: [точка входа](../src/main.ts), [подключение Pinia и темы Vuetify](../src/app/plugins.ts), [маршруты](../src/app/router.ts), [корневой интерфейс](../src/app/App.vue).
- Маршруты принадлежат `src/app/router.ts`: `/` — меню, `/cart` — корзина, `/auth/phone` и `/auth/code` — вход, `/orders/:id` — заказ, `/orders` — история заказов. Страницы в `src/pages/` пока являются честными оболочками разделов без данных и действий.
- Локальное состояние приложения и сессии принадлежит `src/app/`. Оно не содержит API-типов.
- Интеграция API: [единый клиент](../src/shared/api/client.ts) запрашивает `/api/v1`, проверяет ответы во время выполнения и приводит ошибки к `code`, `message`, `details`, `requestId`. [Снимок OpenAPI](../contracts/openapi.json) сравнивается с backend-компактной копией через `npm run contract:check`.
- UI: текущая тема Vuetify определена в [plugins.ts](../src/app/plugins.ts); [ErrorNotice](../src/shared/ui/ErrorNotice.vue) показывает ошибку экрана.
- [Customer Storybook](storybook.md) демонстрирует перенесённые runtime UI,
  дизайн-систему и эталонный каталог состояний.
