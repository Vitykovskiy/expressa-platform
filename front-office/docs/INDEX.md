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

- Клиентское приложение: [точка входа](../src/main.ts), [подключение Pinia и темы Vuetify](../src/app/plugins.ts), [корневой интерфейс](../src/app/App.vue).
- Интеграция API: появится вместе с первым сетевым сценарием в `src/shared/api/`.
- UI: текущая тема Vuetify определена в [plugins.ts](../src/app/plugins.ts); продуктовые компоненты пока отсутствуют.
