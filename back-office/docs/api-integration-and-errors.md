---
title: API-интеграция и граница ошибок back-office
description: Проверяемый HTTP-клиент и безопасное отображение ошибок API.
type: guide
area: back-office
status: current
tags: [back-office, api, errors, openapi]
updated: 2026-08-01
---

# API-интеграция и граница ошибок back-office

Клиент API получает проверенный `VITE_API_BASE_URL`, добавляет к нему `/api/v1`, проверяет форму каждого ответа во время выполнения и возвращает `ApiError` для сетевой ошибки, ошибки API или нарушения контракта.

`ApiError` остаётся на границе HTTP: его код и технические детали не попадают в состояние экрана. [api-error.mapper.ts](../src/app/api-error.mapper.ts) передаёт в `ScreenError` только сообщение и идентификатор запроса, затем [app.store.ts](../src/app/app.store.ts) хранит это состояние для [ErrorNotice.vue](../src/shared/ui/ErrorNotice.vue). Вызывающая пользовательская область выполняет запрос, преобразует пойманный `ApiError` и передаёт результат в store; она не формирует HTTP-пути и не показывает технические детали.

Источник реализации: [client.ts](../src/shared/api/client.ts), [environment.ts](../src/shared/config/environment.ts) и [main.ts](../src/main.ts). Снимок [contracts/openapi.json](../contracts/openapi.json) посимвольно сверяется с backend командой `npm run contract:check`.

При изменении ответа API обновляются проверка в клиенте, маппер при необходимости и тесты рядом с ними. Отображение ошибки не подтверждает действие: запрос завершается исключением до возврата результата.
