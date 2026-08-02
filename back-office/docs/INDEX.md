---
title: Индекс документации back-office
description: Навигация по исходным кодам и правилам автономного рабочего приложения Expressa.
type: index
area: back-office
status: current
tags: [expressa, back-office, navigation]
updated: 2026-08-01
---

# Индекс документации back-office

## Запуск и проверки

- [README приложения](../README.md) содержит версию Node.js, запуск и команды проверок.
- [Точка входа](../src/main.ts) создаёт Vue-приложение и подключает плагины.
- [plugins.ts](../src/app/plugins.ts) подключает Pinia и тему Vuetify.
- [Корневой интерфейс](../src/app/App.vue) отображает базовую рабочую оболочку.

## Рабочие разделы и ответственность

- [Маршруты](../src/app/router.ts) связывают URL с оболочками входа, очереди, доступности и меню.
- [Локальная навигация](../src/app/navigation.ts) содержит статический список рабочих разделов.
- [Страницы](../src/pages/) содержат оболочки входа, очереди, доступности и меню до публикации предметных API и авторизации.
- [API-клиент](../src/shared/api/client.ts) использует `/api/v1`, проверяет каждый ответ во время выполнения и возвращает единый объект ошибки.
- [Снимок OpenAPI](../contracts/openapi.json) проверяется командой `npm run contract:check` посимвольно с `../backend/openapi/openapi.json`.

## Ноты устройства

- [Рабочие разделы и маршруты](working-areas-and-routes.md) описывают статическую навигацию и маршруты оболочки.
- [API-интеграция и граница ошибок](api-integration-and-errors.md) описывает HTTP-клиент, снимок OpenAPI и безопасное состояние ошибки экрана.
- [Владение UI](ui-ownership.md) фиксирует границы оболочки, страниц, store и UI-примитивов.

## Структура исходного кода

Исходный код следует направлению `app -> pages -> widgets -> features -> entities -> shared`; подробные правила размещения описаны в [Definition of Done back-office](../../docs/80-conventions/Code-Definition-of-Done-back-office.md).
