---
title: "HTTP и уведомления сотрудника"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-21
sources:
  - ../../contracts/openapi.json
  - ../../src/app/App.vue
  - ../../src/app/useStaffDomains.ts
  - ../../src/entities/availability/availability.api.ts
  - ../../src/entities/orders/orders.api.ts
  - ../../src/entities/catalog/catalog.api.ts
  - ../../src/entities/settings/settings.api.ts
  - ../../src/entities/users/users.api.ts
  - ../../src/entities/notifications/notifications.api.ts
  - ../../src/entities/notifications/native-push.ts
  - ../../src/entities/notifications/native-intent.ts
  - ../../src/entities/session/session.store.ts
  - ../../src/entities/session/session.api.ts
  - ../../src/features/notifications/notifications.store.ts
  - ../../public/service-worker.js
---

# HTTP и уведомления сотрудника

## HTTP-снимок

Локальный [OpenAPI](../../contracts/openapi.json) — опубликованный снимок
контракта backend, не импорт его исходников. Полный реестр потребителей и
явных N/A находится в [COVERAGE](../COVERAGE.md). Корневой владелец требований —
[контракт сотрудника](../../../docs/50-interfaces/Back-office-UI.md).

Вход использует v2 OTP/request/verify, refresh, me и logout. Заказы читаются
через v3 staff orders с view и отдельным detail; accept/issue сохраняют
действующие v2-команды, ready/reject — v3. Пятистадийная модель, отдельный
отказ и денежные snapshots не подменяются текущим меню.

Меню использует v3 catalog и source menu categories/products/modifier-groups/
modifier-options. Полная цена сохраняется атомарно; произвольные подписи,
ID, количество и скрытая доступность существующих вариантов сохраняются.
Намеренное исключение вариантов и замена множественной связи подтверждаются
для конкретного текущего draft. Архивирование после 204 перечитывает каталог.

Доступность читает v2 availability; product/modifier используют действующий
PATCH, price-choice — v3 availability/price-choice, intake — v2 service/intake.
Настройки сохраняют полный v3 backoffice/settings, часы UTC и положительную целую
вместимость; новые значения не переносят уже назначенные окна.
Пользователи используют v3 users с реальным поиском/role/block; клиентское
скрытие действий не заменяет серверные self/last-active/role ограничения.

DTO рассматриваются как unknown и проверяются до публикации. Транспорт
возвращает статус даже при неверном JSON; предметная граница различает
подтверждение, отказ и неизвестный исход. Автоматического повтора мутации нет.

## Уведомления и logout

Только Barista получает тихое действие «Уведомления». В dialog находятся
назначение и текущий результат. Readiness получает настоящий VAPID public key,
проверяет P-256 и готовит `/service-worker.js`; разрешение не запрашивается.
Новый явный клик «Включить уведомления» сначала вызывает requestPermission,
затем настоящий PushManager.subscribe с userVisibleOnly. Отказ не закрывает
доступ к заказам или доступности.

Inspect передаёт настоящий native proof существующему POST inspect. Enable
использует PUT action=enable с ожидаемой associationVersion. Собственный
DELETE требует текущую версию и отключает связь устройства, сохраняя browser
permission. Чужая связь не передаётся Barista. Unknown-команда сохраняет
неизменный proof/action/version; inspect не повторяет её и не доказывает
авторство. Новая запись разрешается только после явного завершения сверки.
Ошибка чтения не превращает старое состояние в разрешение новой команды.

Worker не содержит fetch/offline cache/очереди записей. Настоящий push
показывает persistent notification с orderId. Staff-view привязан к случайному
lifetime текущего ID/role/token и активному worker своей регистрации. Worker
хранит один последний tuple с двухминутным сроком действия; ответ через
MessageChannel подтверждает inspect/consume. Source/origin/current-controller,
UUID, lifetime и актуальность проверяются до принятия и явной навигации.
Смена идентичности/controller и disposal сбрасывают выбор. Приход push не
меняет раздел; новое намерение заменяет только выбор с polite status.
Занятая операция блокирует явное открытие без позднего auto-open/discard.

Native click фокусирует только scoped owned view; cold `/?order=ID` открывается
при отсутствии scoped окон. Если окно есть, но ownership потерян, оно только
фокусируется без duplicate fallback или WindowClient.navigate. Потеря worker
памяти или сообщения не гарантирует доставку intent; exactly-once не обещано.

До logout App фиксирует подтверждённую own association того же ID/token;
после session pending инъецированный supplier читает только native proof и
сравнивает точные endpoint+p256dh+auth. Совпавший объект либо явный null
передаётся единственной logout-команде. Отсутствующий, занятый, неизвестный или
несовпавший push не мешает session-only logout. Контроллер запроса/эпоха
исключают позднюю отправку после смены контекста. Только подтверждённый204
завершает сеанс. Это не atomic ownership, unsubscribe или browser revoke.

## Наблюдения и пределы

В текущем локальном production-runtime выполнены нормальный вход настоящих
Customer и Barista, настоящие PushSubscription и enable200; Barista inspect200,
own disable204 и новое enable200. Реальный клиентский checkout создал заказ,
смонтированный staff UI провёл accept, ready и issue. Чтение getNotifications
настоящего worker обнаружило уведомление Barista о новом заказе и Customer
о принятии, готовности и выдаче с ID этого заказа. Это наблюдение реальной
доставки до browser notification registry, не осмотр системного баннера.

Разрешение в отдельном persistent browser context подготовлено штатной
возможностью браузера. Это не наблюдение принятия видимого native prompt.
Видимый prompt, системный клик, повторный запуск установленного полного клиента,
независимая backend-проверка proof/version/transfer/revocation и проверка
после development-deploy остаются отдельными обязательными критериями.
Секреты, endpoint и ключи подписки в документацию не помещаются.

После связанной правки logout наблюдались настоящий own-proof logout204 и
переход во вход; новый вход и inspect показали отсутствие связи, затем явный
enable восстановил её. Administrator session-only logout передал null, получил
204 и очистил защищённую навигацию. Эти наблюдения не принимают неизвестные
или конкурентные исходы и не заменяют независимую проверку.

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
