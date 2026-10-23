---
title: "ADR-012: полный back-office по макету Expressa Admin"
type: adr
area: architecture
status: accepted
owner: root
date: 2026-10-21
last_verified: 2026-10-21
sources:
  - ../../../AGENTS.md
  - ../../50-interfaces/Back-office-UI.md
  - ../../50-interfaces/Back-office-API.md
  - ../../../backend/schema.sql
  - ../../../backend/scripts/seed.ts
  - "Запрос пользователя от 2026-10-21: полная реализация и development deploy"
knowledge_role: decision
scope: system
---

# ADR-012: полный back-office по макету Expressa Admin

## Контекст и полномочия

После первоначального требования фиксировать и пропускать противоречия
пользователь потребовал закончить весь back-office и задеплоить его,
прямо разрешив необходимые изменения backend, frontend, документации и базы.
Проверка принудительной ошибки авторизации 503 исключена из условия завершения.
Этот ADR фиксирует ограниченное решение для конкретного
[макета Expressa Admin](https://www.figma.com/design/ZAOqxmGZksdKhQwEjaOrHG/Expressa-Admin-%E2%80%94-Design-System).
Это целевой контракт, а не заявление о готовности API или пользовательской приёмке.

Применяется последний конкретный запрос о полном результате. Прежние
расхождения сохраняются ниже; они разрешаются только в указанном объёме.
Исторические ТЗ и ADR не переписываются. Vue/Vuetify/Pinia, автономность
приложений, серверная авторизация, snapshots, целые рубли, аудит и атомарность
сохраняются. Тесты не создаются, не меняются и не запускаются. Файлы из истории
Git не восстанавливаются. Поставка — только development.

## Зафиксированные расхождения

| Исходное расхождение | Прежняя граница                                                    | Выбранное решение для полного макета                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01-C01              | Три раздела; нет пользователей/настроек                            | Пять разделов администратора: Заказы, Доступность, Меню, Пользователи, Настройки; два у бариста. URL catalog сохранён для Меню.                                                     |
| A01-C02              | Нет отказа; ACCEPTED требует PREPARING перед READY                 | Терминальный отказ хранится отдельно от пяти стадий; одна серверная ready-команда атомарно пишет оба перехода при необходимости.                                                    |
| A01-C03              | У клиента заказа есть только телефон                               | Nullable users.name; явное «Без имени» для отсутствующего имени, без придуманных персон.                                                                                            |
| A01-C04              | Запрет S/M/L редактора; произвольные priceChoices                  | S/M/L — только начальный набор обычных подписей новых ценовых опций. Существующие произвольные подписи, количество, ID и доступность сохраняются. Модель вариантов не возвращается. |
| A01-C05              | Обязательные скрытые поля категории; отдельная замена связей       | Серверные defaults только при создании; source Save атомарно сохраняет имя и явно выбранную связь. Неизменённые множественные связи сохраняются.                                    |
| A01-C06              | Обязательные скрытые поля группы; предписанная боковая форма       | Source dialog и отдельные команды опций; явные серверные defaults создания, скрытые значения редактирования сохраняются.                                                            |
| A01-C07              | Управление сотрудниками только операционное                        | Реальные административные list/create/role/block API с аудитом, отзывом сеансов и защитой администратора.                                                                           |
| A01-C08              | Слоты и управление сотрудниками исключены из MVP; настроек API нет | Рабочие часы и вместимость десятиминутного окна, реальные настройки и атомарное автоматическое распределение новых заказов.                                                         |

Ниже — точный выбранный G3-контракт. Английские формулировки технических
условий сохраняют имена DTO и политику без дополнительных толкований.

## Общие границы

**roles:** All existing staff authorization remains server-owned. Orders/availability: barista|administrator. Catalog/users/settings: administrator only. Customer API remains customer-only. Do not make Administrator a push-barista subscriber by broadening roles.

**errors:** Use current {code,message,details,requestId}, existing 400 validation,401 auth,403 role refusal,404 target absence,409 domain conflict,500 unexpected error conventions. New domain codes below must be represented in OpenAPI and mapped explicitly. Never infer successful mutation from failed/invalid body or blind refetch equality.

**response:** UUID identities; ISO8601 timestamps; monetary values integer rubles as existing contracts, never float rounding. Read failure is distinct from []; nullable values are genuine explicit state.

**concurrency:** One submitting owner per immutable target/draft; server atomic operations with audit actor/requestId. No implicit mutation retries. Unknown after send freezes original draft; explicit GET reveals current state but not authorship of an ambiguous command. Session epoch rejects old read responses and clears protected state on identity/role loss.

**navigation:** Source five admin labels, two barista labels. Existing ?section=catalog remains URL for visible Меню, additional users/settings accepted. Absent section means orders. Preserve number/stage/order and unrelated parameters; invalid duplicate/unknown section prevents protected effects.

## Пользователи

**storage:** users.name text NULL CHECK (name IS NULL OR btrim(name)<>''); users.blocked_at timestamptz NULL; blocked_by uuid NULL FK users. Keep phone/id/role and existing timestamps. Null name exists for OTP-created customers; preserve it rather than backfilling fake names.

### routes

- `GET /api/v3/backoffice/users`: query: search?:string (literal name/phone substring), role?:customer|barista|administrator, blocked?:boolean; invalid/duplicate query →400; response: 200 {users: StaffUserDto[]} sorted name NULLS LAST, phoneE164,id; result contains actual matching accounts including customers
- `POST /api/v3/backoffice/users`: body: {name:string,phoneE164:string,role:'customer'|'barista'|'administrator'}; response: 201 StaffUserDto; duplicate phone →409 USER_PHONE_CONFLICT; no silent upsert
- `PATCH /api/v3/backoffice/users/{userId}/role`: body: {role:'customer'|'barista'|'administrator'}; response: 200 StaffUserDto; same-role operation may return unchanged state, never duplicate audit
- `PATCH /api/v3/backoffice/users/{userId}/block`: body: {blocked:boolean}; response: 200 StaffUserDto; unblock restores eligibility, never old sessions

**dto:** StaffUserDto={id:uuid,name:string|null,phoneE164:string,role:'customer'|'barista'|'administrator',blocked:boolean,createdAt:ISO,updatedAt:ISO}. UI null-name renders explicit 'Без имени' in the name slot; phone stays its own field. This is a declared absence state, not a fabricated person.

**invariants:** All mutations use actor identity from verified session and audit. Self block and self demotion refused; last unblocked administrator cannot be removed, serialized by a stable transaction lock on administrator-set mutation. Block/role change revoke target sessions and detach only target push associations transactionally. Access-token guard rechecks DB role/block state; OTP verification and refresh reject blocked accounts. Do not alter other users' active capabilities.

**source:** Fresh Figma42:2685 source/screenshot: name/phone/role create with default visual Barista and explicit Add; A01 users list/dialog inventory40:1075...40:1506,42:2821/2929/3032. Roles-and-access current operation-only sentence is extended under U007; existing role trust boundary preserved.

## Меню

**reads:** Retain GET /api/v3/backoffice/catalog AdminCatalogV3Dto: categories,products,modifierGroups,modifierOptions,categoryModifierGroups. Do not create duplicate persistent menu hierarchy.

### routes

- `POST /api/v3/backoffice/menu/categories`: body: {name:string,optionGroupId:uuid|null}; response: 201 {category:AdminV3CategoryDto,modifierGroupIds:uuid[]}
- `PATCH /api/v3/backoffice/menu/categories/{categoryId}`: body: {name:string,optionGroupId?:uuid|null}; response: 200 same shape; omitted association preserves all current links, explicit id/null replaces with selected one/empty atomically
- `POST /api/v3/backoffice/menu/option-groups`: body: {name:string}; response: 201 ModifierGroupDto with real empty options
- `PATCH /api/v3/backoffice/menu/option-groups/{groupId}`: body: {name:string}; response: 200 ModifierGroupDto preserving all existing constraints/options
- `POST /api/v3/backoffice/menu/option-groups/{groupId}/options`: body: {name:string,priceDelta:integer>=0}; response: 201 ModifierOptionDto
- `PATCH /api/v3/backoffice/menu/options/{optionId}`: body: {name:string,priceDelta:integer>=0}; response: 200 ModifierOptionDto preserving order/default/availability
- `POST /api/v3/backoffice/menu/products`: body: SourceProductWrite; response: 201 V3ProductResponseDto
- `PATCH /api/v3/backoffice/menu/products/{productId}`: body: SourceProductWrite; response: 200 V3ProductResponseDto preserving hidden fields

**product_write:** SourceProductWrite={categoryId:uuid,name:string,price:integer>=0|null,priceChoices:Array<{id?:uuid,portionLabel:nonblank string,price:integer>=0}>}. Exactly one-price (price nonnull,choices[]) or choices (price null,nonempty choices) branch. Array order is intended order; unchanged existing ids/availability survive; new choices receive generated IDs and availability=true. Existing priceChoices are not restricted to three or S/M/L. Source new-size preset is three ordinary labels S,M,L; never resurrect removed schema model. Existing arbitrary choice labels/row counts must be visible using the source price-row primitive and preserved, not silently converted or dropped.

**creation_policy:** Server owns absent create fields: category description='', next unarchived ordering slot, isActive=true; product description='', portionLabel=null for fixed price, next category order,isActive/isAvailable=true; new group selectionType='single',minSelect=0,maxSelect=1,isActive=true; new option isDefault=false,isAvailable=true,next group order. These are explicit G3 policies, not claims that Figma already supplied values. Existing unexposed edit fields and required group constraints are preserved.

**atomicity:** Source category Save covers name+explicit selected group replacement in one transaction/audit; no frontend POST→PUT chain. If category has multiple existing associations, unchanged selection omits optionGroupId and preserves them; deliberate change asks source confirmation with actual prior group names before replacement. Product removal of existing choices needs explicit version-bound confirmation, never implicit discard. Category/group kind is immutable on edit; create toggle chooses resource kind.

**archive:** Use existing DELETE category/group/option/product routes with actual target confirmation and full catalog refetch. Never delete historical order snapshots. Existing reorder endpoints retained; source absent reorder gestures do not license extra permanent controls.

**source:** Fresh41:112 actual new option-group dialog contains name, kind toggle, disabled selector; fresh41:285 actual S/M/L fields. Source list rows/categorical groups read via A01 evidence and V02 fresh full contexts. ADR008 priceChoices storage remains; old prohibition of source-preset editor and side-panel-only UI composition is superseded narrowly by G3 strict source target, not by restoring old data model.

**compatibility:** No existing endpoint removal, DTO required-field weakening or front-office import. Server source commands adapt once to existing domain validators/use cases. No fake groups/products or option-as-product persistence.

## Заказы и настройки

**storage:** Keep order_stage existing five values. Add orders.rejected_at nullable timestamptz,rejected_by nullable uuid FK users,rejection_reason nullable text, pickup_slot_start nullable timestamptz,pickup_slot_end nullable timestamptz with paired/null constraints and exactly ten minutes when present. New singleton service_operating_settings(id=1,opens_at time,closes_at time,slot_capacity positive integer,updated_at,updated_by FK users), open<close. Existing service_settings accepts_new_orders remains unchanged. Name source is users.name nullable; no name fabrication.

**reads:** Add customer.name:string|null, pickupSlot:{startsAt:ISO,endsAt:ISO}|null, rejection:{reason:string,at:ISO,actorId:uuid}|null to staff v3 order response. Add pickupSlot/rejection to customer v3 reads as optional additive fields for old consumers. Current id,number,createdAt,total,stage,snapshot/events retain their meanings. Existing populated orders without a slot explicitly render 'Время не задано'; no createdAt substitution.

**queue:** GET /api/v3/backoffice/orders retains stage/number. Add view?:all|new|confirmed|ready; stage and view together →400. all includes terminal issued/rejected; new=CREATED AND not rejected; confirmed=(ACCEPTED OR PREPARING) AND not rejected; ready=READY AND not rejected. Server-derived source presentation groups are explicit projection, not replacement domain stages. Sort createdAt,id ascending.

### actions

- `POST /api/v2/backoffice/orders/{orderId}/accept`: body: existing body; effect: CREATED→ACCEPTED, existing audit/push; source Подтвердить
- `POST /api/v3/backoffice/orders/{orderId}/ready`: body: {}; effect: From ACCEPTED atomically record ACCEPTED→PREPARING and PREPARING→READY; from PREPARING record latter only; other/rejected state →409 ORDER_STAGE_CONFLICT. One user action, one transaction, one final ready notification.
- `POST /api/v3/backoffice/orders/{orderId}/reject`: body: {reason:nonblank string}; effect: Only unrejected CREATED; set actual terminal rejection metadata and audit, preserve stored monetary/item snapshots; later transitions blocked. Returns200 updated full staff order; 409 on changed state. Reason exactly submitted, no client-only rejected flag.
- `POST /api/v2/backoffice/orders/{orderId}/issue`: body: existing body; effect: Existing READY→ISSUED after source payment confirmation; no online-payment model.

### settings_routes

- `GET /api/v3/backoffice/settings`: response: 200 {opensAt:'HH:mm',closesAt:'HH:mm',slotCapacity:integer,slotMinutes:10,timeZone:'UTC',updatedAt:ISO|null}
- `PUT /api/v3/backoffice/settings`: body: {opensAt:'HH:mm',closesAt:'HH:mm',slotCapacity:integer}; response: 200 same confirmed DTO; 400 invalid time/capacity/open>=close

**allocation_policy:** New orders and repeats receive earliest available ten-minute pickup window on current UTC service day, starting no earlier than max(opening,next ten-minute boundary at/after transaction clock), ending no later than closing. Capacity counts unrejected CREATED/ACCEPTED/PREPARING/READY orders assigned to that window. Serialize allocation using singleton settings row lock; creation/repeat/idempotency and allocation commit atomically. Existing idempotent replay returns original allocation before taking a new place. No same-day capacity →409 ORDER_CAPACITY_UNAVAILABLE. Issued/rejected no longer count active. Existing accepts_new_orders=false still refuses new creation, not old processing.

**defaults:** Deterministic new settings row 09:00–20:00,capacity5 from current Figma40:1565. UTC is explicit selected technical time basis, matching existing UTC order_day, not inferred cafe locale or browser timezone. Render pickup slot using response timeZone UTC consistently. No overnight/multi-day/branch/special holiday scheduling or customer selection UI added.

**settings_effect:** Changed working hours/capacity affects future allocation only, never reassigns stored orders or erases audit. Reducing capacity below already booked active count stops new allocation for that slot but preserves existing commitments. Domain audit records settings change.

**source:** Fresh40:1565 screenshot/context confirms actual hours and active orders per ten-minute slot. Original MVP section4 explicitly excluded slots/staff-management; latest U007 full named-design delivery authorizes these bounded source features. Record that difference, not historical compatibility. Fresh source metadata/card evidence A01 supplies customer-name/pickup slots and Reject/Confirmed/Ready actions.

**risks:** Automatic next-slot assignment, UTC basis and source default hours are explicit minimal policies selected because source omits customer slot selection/timezone. If primary current Figma/source states a different policy, revise the affected order/settings contracts and consumers before delivery. No real order may be seeded merely to manufacture verification.

## Поставка

**primary_sources:** .github/workflows/development-delivery.yml push main, deploy/deploy.sh guarded expressa-development reset, root AGENTS deployment authorization, docs/70-deployment/Release-and-version-compatibility.md

**route:** Approved exact source → existing non-test checks → ordinary task commit/push main → existing development image workflow and deploy/run-remote.sh → actual HTTPS admin/customer/API → independent R06 deployed observation.

**urls:** https://admin.dev.expressa.vitykovskiy.ru/, https://dev.expressa.vitykovskiy.ru/, https://api.dev.expressa.vitykovskiy.ru

## Последствия и границы проверки

Только конкретные требования этого ADR заменяют противоречащие композиционные
ограничения ADR-011 и прежние исключения MVP; технический DoD не ослабляется.
Существующие versioned endpoints не удаляются и не меняют обязательность полей.
Новые source-команды адаптируются к прежним domain/application invariants.
OpenAPI и клиентские снимки публикуются после реализации маршрутов; до этого
перечисленные новые endpoint — требования, не наблюдаемый факт реализации.

Часы, UTC и автоматическое выделение ближайшего окна — явная выбранная политика,
поскольку макет не определяет часовой пояс или клиентский выбор времени.
Поздний заказ может получить ORDER_CAPACITY_UNAVAILABLE; действующие заказы
никогда не перемещаются. Новые первичные требования о времени требуют точечного
пересмотра этой политики до поставки.

Данные local/development пересоздаются из текущих schema.sql и seed.
Настройки seed: 09:00–20:00 UTC, вместимость 5; существующий каталог и
bootstrap administrator сохраняются без дополнительных проверочных персон
или заказов. Повторный seed не перезаписывает сохранённые рабочие настройки.

Форматирование, lint, typecheck и build подтверждают только статическую часть.
Нужны независимое ревью backend, осмотр последнего UI и независимая проверка
реальной development-поставки; они не заменяют пользовательскую приёмку.

## Одно заполненное значение размера

Уточнение по прямому требованию пользователя:
ценовая модель с `price=null`, `portionLabel=null` допускает одну или больше
реальных `priceChoices`. Одна опция S остаётся опцией со своим ID и подписью
в меню, корзине и snapshot заказа; она не преобразуется в фиксированную цену.
Товар с фиксированной ценой по-прежнему имеет пустой список опций.

В исходном наборе S/M/L пустое или состоящее из пробелов поле означает, что
опция не создаётся. Любая непустая неверная цена блокирует сохранение целиком;
допустимы только целые значения от 0 до 2147483647. Явный 0 не равен пустому
полю. Нужна хотя бы одна заполненная допустимая цена. При повторном открытии
сохранённого подмножества S/M/L показываются все три поля в порядке S/M/L:
сохранённые ID и цены привязаны к своим подписям, отсутствующие поля пусты.
Произвольные прежние подписи и порядок строк сохраняются без преобразования.

Очистка цены существующей опции означает её исключение. До отправки требуется
подтверждение конкретной версии черновика с перечислением удаляемых опций;
отмена оставляет черновик и сохранённые данные. Сервер архивирует исключённые
ID, сохраняет ID и доступность оставшихся; повторное заполнение исключённой
строки создаёт новую опцию. Исторические snapshots заказов не меняются.
Для заказа товара с любым непустым списком требуется действующий доступный
`priceChoiceId`; отсутствие, чужой ID или недоступная опция отклоняются.
Это уточнение заменяет прежнее программное ограничение «не меньше двух»,
не вводит модель вариантов, новую схему хранения или миграцию seed.
