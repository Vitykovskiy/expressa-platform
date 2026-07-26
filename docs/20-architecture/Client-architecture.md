---
title: Архитектура клиентов
description: Целевое устройство front-office и back-office как автономных PWA.
type: architecture
area: architecture
status: current
tags: [expressa, frontend, pwa, vue]
updated: 2026-07-26
---

# Архитектура клиентов

- **TR-REP-002.** Репозиторий `front-office` использует Vue 3, Vuetify, TypeScript, Vite, npm, реализует устанавливаемое PWA, содержит базу знаний по требованиям раздела 2.3, тесты и pipeline.
- **TR-REP-003.** Репозиторий `back-office` использует Vue 3, Vuetify, TypeScript, Vite, npm, реализует устанавливаемое PWA, содержит базу знаний по требованиям раздела 2.3, тесты и pipeline.

## 17. Архитектура front-office и back-office

Каждый клиентский репозиторий содержит собственные:

- тему Vuetify;
- UI-компоненты;
- Storybook;
- маршруты;
- хранилища Pinia;
- API-клиент;
- типы API;
- обработку ошибок;
- тестовые фикстуры;
- E2E-сценарии;
- документацию.

Рекомендуемая структура:

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
    api/
    ui/
    lib/
    config/
```

Каталог `shared` принадлежит конкретному репозиторию и обслуживает только это приложение.

Front-office и back-office устанавливаются как PWA и поддерживают push-уведомления. Основные функции приложений требуют подключения к сети.
