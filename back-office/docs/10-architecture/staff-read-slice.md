---
title: "Session и чтение заказов"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/50-interfaces/Authentication-API.md
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../docs/30-domain/Order-snapshots.md
  - ../../../backend/openapi/openapi.json
  - ../../contracts/openapi.json
  - ../../src/app/App.vue
  - ../../src/app/navigation.ts
  - ../../src/entities/session/session.store.ts
  - ../../src/entities/order/order.store.ts
  - ../../src/entities/order/order.validation.ts
  - ../../src/features/auth/otp.store.ts
  - ../../src/pages/OrdersPage.vue
  - ../../vite.config.constants.ts
---

# Session и чтение заказов

Код реализует вход сотрудника, session-gate, очередь, поиск и детали со снимками/историей. На 2026-10-10 в изолированной local-среде наблюдены штатный OTP-вход администратора и бариста, отказ customer, очередь и снимки заказов, созданных через текущий front-office checkout. Это частичное runtime-доказательство; независимая приёмка и оставшиеся критерии открыты.

## HTTP-снимок

[contracts/openapi.json](../../contracts/openapi.json) — локальная точная копия
опубликованного текущего backend OpenAPI. Backend владеет публикацией; staff-клиент
владеет только этим сериализованным артефактом. Синхронизация описана в
[межконтурном контракте](../../../docs/20-architecture/Cross-repository-contracts.md).
Это не импорт чужого исходного кода, generated runtime client или восстановление
старой реализации. Отдельного staff `contract:check` сейчас нет; проверка байтов
не доказывает role policy, доставку push или приёмку UI. Наличие серверной
Barista-привязки не доказывает permission/subscription/service worker/click/logout.
Текущие исходники сценария описаны ниже; native и независимая приёмка открыты.

## Владельцы

| Владелец                                         | Ответственность                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `app/App.vue`, `StaffShell.vue`, `navigation.ts` | Session-gate, оболочка, URL                                                            |
| `app/theme.ts`                                   | Единственное предпочтение темы; ThemeControl вызывает владельца                        |
| `entities/session/`                              | DTO validation, mapper, token/user lifetime, сериализация auth, single-flight refresh  |
| `features/auth/`                                 | Phone/code draft, server deadlines, локальные ошибки                                   |
| `entities/order/`                                | V3 API, nested validation, mapper, list/detail concurrency и confirmed state           |
| `pages/`                                         | Композиция, polling lifecycle, focus/scroll                                            |
| `widgets/orders/`, `features/order-search/`      | Readonly представление и типизированные события                                        |
| `shared/api/`                                    | Credentials, Bearer, exact status, error envelope, timeout/abort; без доменных моделей |

Pinia уже устанавливается foundation runtime-фабрикой. Второй bootstrap не создаётся. Workbench остаётся демонстрацией Storybook; production App его не включает.

## Сеанс

Token находится только в памяти. Startup вызывает cookie refresh и `/me`; staff доступен только после валидной роли barista/administrator. Customer не получает staff UI. Ошибка/невалидная схема не открывает очередь. GET может повториться один раз после успешного refresh; конкурентные refresh объединяются. Auth-команды не повторяются автоматически. Generation отбрасывает поздние ответы после смены сеанса, в том числе перед обработкой ошибок обоих GET-попыток: устаревший отказ не обновляет и не очищает новый сеанс.

Logout по умолчанию отправляет `{pushSubscription:null}`; App может передать узкий native proof supplier после установки session pending guard. Только 204 подтверждает выход. Известный отказ показывает ошибку; неизвестный исход скрывает защищённые данные и требует проверки сеанса. Неопределённый verify сверяется через refresh без replay. После неопределённой отправки OTP можно ввести реально пришедший код; UI не утверждает отправку. Request/verify cooldown берётся из ответа/Retry-After, не фиксированного локального срока. После ошибки отправки/проверки page-owner переводит фокус на соответствующее invalid поле после рендера; ввод каждого символа не меняет фокус.

Открывать `http://localhost:5174/`: `/api` проксируется на `http://localhost:3001` с credentials и исходным Origin. Backend должен разрешать этот Origin и иметь текущие схему/seed, рабочий OTP provider и staff пользователя. `127.0.0.1` — другой Origin/cookie host. Backend guards не меняются; секреты/token не сохраняются в URL/storage/документацию.

Текущая изолированная среда использует существующий `backend/compose.local.yml` с отдельным Compose project `expressa-bo20-d05-20261010`, container `expressa-bo20-d05-20261010-db` и volume; PostgreSQL доступен только на loopback-порту `55434`. К пустой новой базе применены штатные `db:init`, `seed` и `staff`. Backend работает с `NODE_ENV=local`, текущей схемой и санкционированным development OTP; readiness подтвердил соединение с базой. Customer front-office запущен на `http://localhost:5175/` через поддерживаемый `VITE_API_PROXY_TARGET`. Обе точные browser origins разрешены конфигурацией backend. Другие процессы и заполненные базы не изменялись.

## Очередь и восстановление

App сохраняет Orders и Availability через KeepAlive; administrator-каталог
имеет отдельную защищённую cache-границу по текущей роли и ID. Orders активирует обычные чтения/опрос и media/visibility listeners
только в своём активном разделе; деактивация отменяет list/detail reads, но
не operation/reconciliation прежнего order store. Сохранённый ввод остаётся
у страницы. Раздельные heading/scroll и off-section operation контексты
принадлежат App. Возврат с сохранёнными фильтрами и off-section intake
GET-recovery наблюдены локально; точная polling/concurrency-матрица ещё
не подтверждена. Предыдущие captures не доказывают изменённую оболочку. Владельцы описаны в
[availability slice](availability-slice.md).

Query `number`, `stage`, `order` хранит применённый фильтр/UUID. Дубли/невалидный URL дают сбрасываемую ошибку. Back/Forward синхронизируют страницу. Смена стадии не применяет незавершённый ввод номера. Номер непустой и не длиннее 64; encoding принадлежит API.

Используются только v3 list/detail GET. List — массив без pagination/total endpoint; счётчик относится к нему, серверный порядок сохраняется. Новый фильтр очищает старые строки; failed refresh того же запроса сохраняет last-confirmed модель с ошибкой/временем. Выбор сохраняется, detail 404 очищает модель. Abort/identity guard не позволяет старому ответу заменить новый запрос.

Page-owner синхронизирует текущий URL после завершения auth-команды: busy-сеанс не помечает начальные фильтры/выбор как прочитанные. Изменение busy запускает отложенную начальную синхронизацию сразу после готовности; первоначальная загрузка имеет loading-состояние. Результат не зависит от следующего polling tick или ручного обновления. Session guard остаётся неизменным.

Visible page обновляется каждые 5 секунд без перекрытия одного owner. Hidden/unmount/logout отменяют запросы/таймеры; возврат обновляет данные. От 1024px список/детали рядом; ниже деталь — обычная зона с возвратом. Фокус переходит на heading и возвращается к строке/heading очереди, scroll сохраняется.

Mapper сохраняет saved labels, nullable portionLabel/priceChoiceId, количества, целые рубли, modifiers и actor/from/to/time. Текущий каталог не реконструирует заказ. Widgets получают readonly модели и типизированный action-slot; команды вызываются page-owner через order store.

## Lifecycle-команды

`entities/order/order.api.ts` отправляет четыре текущих v2 POST без тела и replay. Общая nested validation/mapper обслуживает текущие v3 reads и v2 command-response; граница команды отдельно проверяет UUID, source/action, HTTP200, целый неотрицательный int32 total, identity, target stage и наличие серверного события actor/from/to. Числовые поля shared nested DTO проверяются как конечные numbers по текущей OpenAPI-схеме, без преобразования значений.

Session владеет `authenticatedCommand`: refresh разрешён до отправки, отправленный POST не повторяется даже после401. Generation и staff-проверка отбрасывают устаревшие исходы; current401/403 закрывает защищённый сеанс. Token не экспортируется. Order store хранит original id/number/from/action и одну активную команду; до неё отменяет старые reads, блокирует overlapping commands/polling и публикует только подтверждённую сервером модель. Смена фильтра/выбора не меняет original context. После подтверждения тихо обновляются серверная очередь и выбранная деталь.

409 и неоднозначный network/timeout/5xx/invalid200 автоматически сверяются единственным v3 GET original order. Неудачная сверка оставляет блокировку и одну кнопку «Проверить заказ»;400 предлагает «Обновить заказ». Сверка не отправляет POST и не утверждает, что событие выполнил этот сотрудник. После authoritative read текущая стадия определяет новое явное действие, в том числе повтор original action при unchanged stage.404 показывает недоступность и возврат. Session clear инвалидирует command/reconciliation; скрытие страницы отменяет reads, но не утверждает отмену отправленной команды.

`features/order-transition/OrderTransition.vue` получает readonly order/operation и сообщает transition/reconcile/back. Action-slot расположен после identity перед составом. Только одна next-stage action: cashier-payment meaning включён в «Оплачен на кассе — выдать», без payment model, checkbox или второго dialog. При другой выбранной детали единственная operation region находится над workspace и сохраняет номер original order. Page владеет одним atomic polite status и переносом фокуса к heading после действия только пока пользователь не ушёл из initiating region; next action не получает autofocus. Обычные позднейшие read-errors не скрываются завершённой командой.

Исторический блокер D06/1 (устранён process-only в D05/2; новые наблюдения ниже): старые native runtime handles были недоступны, API3001 и preview5174 не имели listener. Запущен только прежний Vite preview5174 без конфигурационных изменений; текущий UI безопасно показывает «Не удалось проверить сеанс» при недоступном API. Backend/DB не запускались, не сбрасывались и не менялись; OTP не запрашивался. Исторические положительные observations выше остаются историческими. Новые команды, их history/pending/recovery/focus, обе роли и affected protected geometry требуют реального runtime и независимого review. Подробности: task evidence/D06/ и reports/D06.yaml. Это реализация, не приёмка.

## Граница

В D06/2 после process-only восстановления прежнего API наблюдены все четыре lifecycle-команды администратора и бариста на двух настоящих заказах, созданных ранее через checkout. Сервер вернул HTTP200, четыре события actor/from/to/time и неизменные snapshot/total; для ISSUED отсутствует следующее действие. Обычный offline issue оставил READY и единственный recovery; после смены selection recovery прочитал original order и восстановил текущие детали без POST-replay или фокуса на другом заказе. Это owner-observation, не независимая приёмка. READY осмотрен в обеих темах на девяти обязательных ширинах; dark320 — также при высоте568. Pending, race/conflict и полный error/auth-concurrency matrix не установлены этим проходом. Категории и availability описаны в отдельных slices; product/modifier authoring, push/PWA и полный staff-workflow ещё не завершены. Для read slice наблюдены положительный вход, refresh/logout, отзыв сеанса через штатный выход в другой вкладке, поиск, выбранные детали, пустые результаты, polling нового заказа и offline/retry. Очередь и детали осмотрены в обеих темах на ширинах `320`, `599`, `600`, `601`, `768`, `1023`, `1024`, `1025`, `1440` CSS px. Эти наблюдения не подтверждают длинные saved labels, все auth-concurrency исходы, настоящий 200% zoom, отказ storage или числовой contrast. Нетестовые команды — в [README](../../README.md); тесты запрещены. D05 и D04/3 reports дополняют evidence; текущие доказательства находятся в `.codex/tmp/tasks/bo20-foundation-20261009/evidence/D05/`, `evidence/D04/attempt3/` и независимом `evidence/R02/attempt3/` (от task root); разрешение продолжения не закрывает inherited foundation acceptance gaps и не заменяет независимый review.

## Уведомления и logout

Текущий `entities/notification/notification.store.ts` отделяет native permission,
subscription, серверную association и неизвестный исход отправки. Proof и
version остаются в приватной памяти владельца; наружу передаются только
presentation copy/actions. `notification.api.ts` проверяет exact GET/POST/PUT200,
DELETE204, none/null и current|other/UUID version. GET использует session read;
inspect POST — nonreplayed session command, хотя в UI это чтение. Enable
отправляет только `action: enable, expectedVersion: null`; foreign transfer,
unsubscribe и rotation отсутствуют. Disable использует исходные own proof/version.

Открытие feature только читает. Подготовка по явному enable валидирует настоящий
P256 VAPID key и ожидаемую собственную активную регистрацию. После готовности
новый жест вызывает subscribe до первого await; permission запрашивает native
subscribe. Совместимая реальная subscription повторно не создаётся. До API
проверяются identity/epoch/session, scope/script, userVisibleOnly, actual key,
expiration, HTTPS endpoint/native keys и текущее совпадение proof. Readiness
не является подключением. Native read ограничен 10 секундами на шаг;
инвалидация снимает собственные listeners/timers, но не отменяет уже начатую
операцию браузера или отправленный серверный запрос.

Sent outcome неизвестен при network/timeout/5xx/invalid/unrecognized или
потере контекста. Только точные structured400 VALIDATION_ERROR,
409 PUSH_ASSOCIATION_CONFLICT, guarded401 UNAUTHORIZED/403 ACCESS_DENIED
дают известный отказ. Unknown не повторяется; явный inspect точного исходного
proof показывает текущую association отдельно. После корректного чтения
«Завершить проверку» только освобождает локальную проверку, сбрасывая eligibility
для следующего намерения. Нужен новый actual read. Закрытие dialog не отменяет
операцию. Старый sent/unknown контекст остаётся приватным после identity loss;
он не публикуется новому actor. Пока такой контекст удерживается в этом
экземпляре, новые notification mutations не отправляются; обычная работа доступна.
Этот lifetime предел требует независимого UX/native review, не объявлен принятым.

App передаёт `logoutProof` в `session.logout`. Pending guard устанавливается
до supplier; supplier делает только конечное native чтение и сравнивает
текущий proof с confirmed-own того же identity. Только реальное совпадение
передаёт object, иначе null. Нет protected API во время pending, token getter,
version в logout, permission revoke или local unsubscribe. Session повторно
проверяет generation/status перед exact ADR009 body и требует204. Это не
атомарная проверка ownership: unconfirmed concurrent enable может пережить
null logout; выбранная доставка и локальная subscription не отзываются.

## Worker и клик

Root `staff-push-worker.ts` — import-only вход app worker. App импортирует
`?worker&url`; Vite собирает ES worker в root `staff-push-worker.js`. Реальные
dev path/MIME/module loading/activation/scope остаются ненаблюдёнными.
Worker не содержит fetch/cache/storage/queue/subscriptionchange/skipWaiting/
clients.claim/reload. Push принимает только title/body/order UUID, показывает
native уведомление через waitUntil; arrival не меняет workspace.

Click закрывает уведомление, синхронно сохраняет native technical epoch и
монотонную sequence. Выбирается один same-origin in-scope существующий клиент
по focused/visible/native order, включая uncontrolled; передаётся bounded
intent без navigate/reload/broadcast. Только если owned view отсутствует,
открывается scope-relative `?order=UUID` через обычный auth. Нет duplicate
fallback после потерянного acknowledgement. Standalone openWindow может
переиспользовать контекст; независимое новое окно не гарантируется.

`app/notification-click.ts` принимает только ожидаемый active worker и
подтверждает exact latest tuple по ограниченному MessagePort. Старые same-epoch
sequence не заменяют новые; позднее подтверждение теряет право при новом
сообщении/identity/lifetime. Restart без volatile latest отвергает старый intent.
Port/listener/timer очищаются; timestamp, persistent click log и replay отсутствуют.
Это ограниченная проверка текущего источника, не exactly-once доставка и не
атомарная блокировка нового физического клика во время передачи ответа.

App сразу выбирает exact order через обычную history только в свободной
очереди без selected task, dirty search/catalog, locked siblings, modal,
invalid URL, busy session или нового pointer/key/popstate ввода. Иначе сохраняет
один latest navigation intent. Explicit action снова подтверждает tuple и
guards; applied filters/draft/исходная operation сохраняются, более новый
intent не потребляется. OrderSearch сообщает readonly dirty через OrdersPage,
draft остаётся у поиска. Закрытие modal не вызывает позднюю навигацию.
Identity/access/logout очищают видимый click и ответы. Свежий anonymous вход
может получить guarded URL, но не staff-доступ или защищённый fetch.

Исходники и успешные нетестовые проверки не доказывают native permission,
subscription/association/delivery/click, actual install, protected UI, оба theme
на девяти ширинах, adverse/processed-lost/concurrency, sibling preservation,
focus/scroll/assistive/reduced motion/real200%zoom/composited contrast. Все прежние
непринятые backend/foundation/privacy/Kombai/StyleSeed критерии сохранены.

Назад к [архитектуре](INDEX.md).
