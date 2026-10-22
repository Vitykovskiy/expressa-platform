---
title: "Push-уведомления и привязки"
type: interface
owner: root
last_verified: 2026-10-21
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/notifications/transport/push-subscriptions.controller.ts
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
knowledge_role: implementation
scope: system
---

# Push-уведомления и привязки

Текущие маршруты: `GET /api/v2/push/public-key`, `POST /api/v2/push/subscriptions/inspect`, `PUT /api/v2/push/subscriptions/association`, `DELETE /api/v2/push/subscriptions/association`. Точные HTTP-схемы — [OpenAPI](../../backend/openapi/openapi.json), реализация — [controller](../../backend/src/notifications/transport/push-subscriptions.controller.ts). Все маршруты требуют сессии; inspect и association доступны Customer и Barista, без Administrator. Точная роль-политика принадлежит [RolesGuard](../../backend/src/auth/transport/roles.guard.ts), а не машиночитаемой схеме OpenAPI. Описание операции поясняет доступ, но не заменяет серверную проверку.

[Серверная нота](../../backend/docs/30-domains/Notifications.md) описывает proof/version,
отказ Barista в любом чужом переносе, сохранённое поведение Customer и выбор
получателей нового заказа только среди Barista. Текущая B05 реализация повторно проверяет роль, block/revoke и сессию
под транзакционными блокировками; уже выбранная внешняя асинхронная отправка
не отзывается.

Прямых маршрутов записи / удаления subscription нет. Logout, проверка подписки без действующей сессии, повтор запроса, транзакции и ошибки cookie описаны в [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).

Разрешение браузера, локальная подписка, серверная association и доставка уведомления — разные состояния. Наличие API привязки не является доказательством доставки push.

## Staff frontend

Текущие [владельцы staff](../../back-office/docs/10-architecture/staff-read-slice.md#уведомления-и-logout)
реализуют Barista-only явное подключение и отключение своей связи. Открытие
dialog готовит worker и действительный public key без запроса разрешения,
создания подписки или association. Новый клик «Включить уведомления» первым
асинхронным действием запрашивает permission; затем native subscribe получает
настоящую подписку. Только проверенный ответ association подтверждает связь.
Чужая связь Barista не переносится и не удаляется.

Неизвестная команда сохраняет исходные proof/version/identity в памяти без
повтора. Inspect показывает текущую связь отдельно; завершение сверки не
доказывает автора исходного изменения. До logout App фиксирует подтверждённую
собственную связь того же ID/token. После перехода session в pending supplier
только читает текущий native proof без register/permission/subscribe и сравнивает
endpoint+p256dh+auth. Совпавший proof передаётся одной logout-команде, иначе
передаётся явный null по ADR-009. Смена request/identity эпохи исключает позднюю
отправку. Занятый или неизвестный push не мешает session-only logout.
Это не атомарная проверка ownership между браузером и backend, не unsubscribe
и не отзыв browser permission либо уже доставленного уведомления.

Push-only [worker](../../back-office/public/service-worker.js) показывает
валидированные title/body/order UUID. Приход push не меняет workspace.
Только активный worker своей точной регистрации обслуживает ограниченное
намерение клика. Текущий staff-view регистрирует случайный lifetime; при смене
ID/role/token, controller или disposal старый lifetime и выбор сбрасываются.
Worker хранит один последний tuple с UUID, orderId, lifetime и сроком действия.
App проверяет source/origin/current controller и подтверждает актуальность
у владеющего worker через MessageChannel; явное открытие повторно подтверждает
и потребляет этот tuple. Дубликаты, старые, чужие и заменённые сообщения
не меняют раздел. Занятая работа блокирует открытие без позднего auto-open,
замены dialog или удаления draft.

Worker фокусирует только выбранный контролируемый scoped view без
WindowClient.navigate. Если scoped окно есть, но ownership потерян, оно только
фокусируется; повторное окно не создаётся. Cold URL открывается при отсутствии
scoped окон. Worker restart, потеря сообщения и standalone reuse остаются
возможными; exactly-once и гарантированное отдельное окно не обещаны.

Серверные membership/user/session/endpoint locks и текущая проверка роли,
block/revoke, proof/version описаны в
[Notifications](../../backend/docs/30-domains/Notifications.md). Это текущая
реализация B05; source-анализ блокировок не заменяет наблюдение конкурентного
расписания. Уже выбранную внешнюю отправку отозвать не обещано.

Локально получены настоящие native association и сообщения в browser notification
registry после реальных заказов. Видимый native prompt, системный click,
повторный запуск полного установленного клиента и независимая проверка
финальной связанной реализации остаются отдельными обязательными критериями.
Browser-context подготовка permission не считается принятием видимого prompt.

При настоящем notification click worker заново запрашивает текущий lifetime
контролируемых scoped окон через ограниченный challenge/response. App отвечает
только активному worker своей регистрации и только из текущего staff-контекста.
Это восстанавливает owner после обычного завершения и повторного запуска
того же worker без controllerchange; новый click не зависит от прежней
worker-памяти. Старое намерение не восстанавливается и не переигрывается.
Новый выбор по-прежнему проверяется/потребляется явно; отсутствие
подтверждённого owner оставляет безопасный focus-only исход без нового окна.
Реальное наблюдение системного клика после restart требует отдельного
подтверждения; документация не считает source-анализ таким наблюдением.
