---
title: "HTTP и уведомления сотрудника"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-27
sources:
  - ../../contracts/openapi.json
  - ../../src/app/App.vue
  - ../../src/app/useApplicationDomains.ts
  - ../../src/modules/availability/availability.api.ts
  - ../../src/modules/orders/orders.api.ts
  - ../../src/modules/catalog/catalog.api.ts
  - ../../src/modules/settings/settings.api.ts
  - ../../src/modules/users/users.api.ts
  - ../../src/modules/notifications/notifications.api.ts
  - ../../src/modules/notifications/native-push.ts
  - ../../src/modules/notifications/native-intent.ts
  - ../../src/modules/session/session.store.ts
  - ../../src/modules/session/session.api.ts
  - ../../src/modules/notifications/notifications.store.ts
  - ../../public/service-worker.js
---

# HTTP и уведомления сотрудника

## HTTP-снимок

Локальный [OpenAPI](../../contracts/openapi.json) — опубликованный снимок
контракта backend, не импорт его исходников. Полный реестр потребителей и
явных N/A находится в [COVERAGE](../COVERAGE.md). Корневой владелец требований —
[контракт сотрудника](../../../docs/50-interfaces/Back-office-UI.md).

Вход использует v2 OTP/request/verify с явным staff context, refresh, me и logout.
`/me` проверяется целиком, включая обязательные nullable memberships;
только включённый employee в staff context открывает защищённое содержимое. Заказы читаются
через v3 staff orders с view и отдельным detail; accept/issue сохраняют
действующие v2-команды, ready/reject — v3. Ответы accept/issue проверяются как
`OrderCoreDto`: имя покупателя, окно выдачи и метаданные отказа сохраняются из
отправленного заказа после проверки совпадения покупателя. Чтение и ready/reject
требуют полный `OrderDto` с явными nullable-полями. Перед подтверждением команды
проверяются ID заказа, ожидаемая стадия и метаданные отказа. Эта адаптация
действующих ответов сохраняется. Пятистадийная модель, отдельный отказ и денежные
snapshots не подменяются текущим меню.

Меню использует v3 catalog и source menu categories/products/option-groups/options.
В source menu вариант создаётся через `POST option-groups/{groupId}/options`
и изменяется через `PATCH options/{optionId}`.
Полная цена сохраняется атомарно; произвольные подписи,
ID, количество и скрытая доступность существующих вариантов сохраняются.
Намеренное исключение вариантов и замена множественной связи подтверждаются
для конкретного текущего draft. Архивирование после 204 перечитывает каталог.

Доступность читает v2 availability; product/modifier используют действующий
PATCH, price-choice — v3 availability/price-choice, intake — v2 service/intake.
Настройки сохраняют полный v3 backoffice/settings, часы UTC и положительную целую
вместимость; новые значения не переносят уже назначенные окна.
Пользователи используют отдельные v3 backoffice/employees и customers.
Employees читает search/role/blocked, enrollment отправляет name/phoneE164/role;
role и access меняют только сотрудника. Customers читает только search и
registered-only DTO без роли, доступа и команд. Обе вкладки сохраняют тот же
account ID/номер при намеренном пересечении. Work access передаёт `enabled`,
никогда не вызывает глобальный `/users/{userId}/block`. DTO разделяет
`accessEnabled` и `accountBlocked`; ошибку USER_ACCESS_CONFLICT нельзя считать
успешным разблокированием. USER_NAME_CONFLICT показывает конфликт имени без
замены канонического имени. Клиентское скрытие действий не заменяет серверные
self/last-active/role ограничения.

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

Native click фокусирует только scoped owned view; cold `/orders?order=ID` открывается
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

Изменение staff-context и Employees/Customers описывает текущий исходник;
полная интеграция, защищённые состояния и новая визуальная приёмка ещё
не подтверждены. Автор D05 открыл отдельный headless Chrome на
`http://localhost:5174/users`: доступен экран входа, refresh вернул401.
Это не наблюдение защищённых списков или рабочих команд. Общая локальная БД,
backend и финальные межконтурные сценарии принадлежат D06/R07; исторические
push-наблюдения ниже не обновляют свежесть доказательств этой модели.

До текущего рефакторинга в локальном production-runtime выполнены нормальный вход настоящих
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

Эти наблюдения относятся к прежнему интеграционному состоянию. Предыдущий перенос
notifications store в `features/notifications/model` и dialog в
`features/notifications/ui` был этапом прежней структуры. Сейчас оба владельца
находятся в `modules/notifications`, dialog — в `components`; source-review
не обновляет свежесть native-доказательств. Текущий рефакторинг не подтверждает повторную
доставку, системный клик или установленный runtime.

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
