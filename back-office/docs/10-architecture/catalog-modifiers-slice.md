---
title: "Группы добавок и атомарный состав"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../backend/src/catalog/transport/catalog-modifiers.controller.ts
  - ../../../backend/src/catalog/domain/modifier-admin.policy.ts
  - ../../../backend/src/catalog/application/manage-modifiers.use-case.ts
  - ../../../backend/src/catalog/adapters/postgres-modifiers.repository.ts
  - ../../src/entities/catalog/catalog.store.ts
  - ../../src/entities/catalog/modifier.mapper.ts
  - ../../src/entities/catalog/modifier.api.ts
  - ../../src/features/modifier-group-edit/ModifierForm.vue
  - ../../src/widgets/catalog/ModifierWorkspace.vue
  - ../../src/pages/CatalogPage.vue
---

# Группы добавок и атомарный состав

Это описание текущей реализации administrator create/full edit/archive группы
и отдельного полного порядка её добавок. Полная ручная матрица и независимая
приёмка открыты; исходники и сборка не заменяют наблюдение.
[Связи категории](catalog-associations-slice.md) редактируются отдельной задачей
того же owner, без изменения group fields. Прямые связи товаров и push/PWA ещё не реализованы.

## Владельцы

`entities/catalog/catalog.store.ts` владеет одним union задач/намерений/операций
категорий, товаров и групп, одним набором access/read/operation epochs и одной
записью. `modifierTask` — readonly selector, не второй store.
`modifier.mapper.ts` преобразует полный raw draft и сравнивает aggregate;
`modifier.api.ts` проверяет конкретный command response. HTTP и бизнес-состояние
не попадают в presentation. `features/modifier-group-edit/`, `modifier-group-search/`,
`modifier-group-archive/`, `modifier-option-reorder/` получают readonly props/events.
`widgets/catalog/ModifierWorkspace.vue` компонует list/form/current state;
`CatalogOperation.vue` направляет статус группы своему feature, а прежние
category/product статусы — неизменённому CategoryOperation. Page владеет локальными
режимами и modal/focus; App показывает original operation вне раздела.

«Группы добавок» хранится только в памяти разрешённого сеанса, начальный режим
остаётся «Категории». Занятая задача блокирует поиск, другой объект, создание,
режим и reorder. Wide от 1024 px имеет максимум две зоны; ниже форма заменяет
список. Recovery показывает текущие значения внутри существующей зоны, не
создаёт третью панель. Нет постоянных информационных banners.

## Черновик и инварианты

Новая группа имеет пустое имя, невыбранный selectionType, пустые min/max и
пустой состав, isActive=false. Новая строка имеет пустые name/priceDelta/order,
isDefault=false и isAvailable=false. Имена сохраняются raw; trim проверяет
только непустоту. Повторяющиеся имена разрешены. Числа требуют явного целого
0..2147483647; max>=min, single требует max=1. Значения не обрезаются и не
масштабируются, цена не заменяется бесплатной. Порядки уникальны и могут иметь
пропуски. Ввод не переставляет строки; adjacent move меняет местами positions
и два валидных уникальных order. Невалидный порядок исправляется явно.

Только active && min>0 требует availableCount>=min и доступных defaults от min
до max с priceDelta=0. Optional/inactive пропускают эту проверку; unavailable
default сохраняет флаг. Флаги не доказывают общую orderability продукта.

Edit замораживает полный current group/options baseline. Локальные keys стабильны,
server IDs неизменяемы; retained IDs берутся только из этой исходной группы,
без дубликатов, новые строки не имеют ID. POST не отправляет child IDs.
Исключённые existing строки остаются в unsent removed branch и возвращаются
по тому же key. Save подтверждает конкретные исходные имена для groupId/revision;
редактирование, уход или access loss отменяет подтверждение. Удаление новой
строки не требует archive confirmation. После отправки restore отсутствует.

## HTTP, baseline и конкретный ответ

Полный v3 administrator GET отдаёт группы и добавки flat с groupId; entity
собирает aggregate. V2 modifier POST201/PATCH200 отправляет полный состав и
получает nested options. DELETE204 soft-архивирует только parent, сохраняет
children/links. Ответ 204 не доказывает membership связанных проекций:
catalog freshness сбрасывается и выполняется полный GET.

Отдельный POST200 `/{groupId}/options/reorder` отправляет полный optionIds,
включая unavailable/default, без поиска и несохранённых строк. Baseline охватывает
все поля parent/options. Ответ обязан содержать ровно captured IDs в указанном
порядке, последовательные zero-based sortOrder и неизменённые прочие поля.
Группы не переставляются; отдельного Save добавки нет.

Перед edit/archive/reorder полный GET сравнивает каждое parent/option поле и
membership. Changed/missing source запрещает запись и оставляет readonly draft
для явной сверки/выхода. Create проверяет текущие valid source/access/identity.
Это не CAS и не idempotency: GET-write race остаётся.

Конкретный aggregate response проверяется по raw parent fields, update ID или
неизвестному каталогу create ID, полной длине children, уникальным IDs/groupId,
всем raw child fields и source ordering. Retained IDs точны, omitted отсутствуют,
новые IDs не встречались в полном каталоге и не равны group ID. Новая строка
сопоставляется только внутри конкретного валидного ответа по уникальному
captured order и всем raw полям. Неправильный count/ID/context/field/order —
sent-unknown, а не частичный успех. Use-case отвергает foreign/missing/archived/
duplicate update IDs до persistence; create supplied IDs может молча исключить
строки. Repository revival не выдаётся за разрешённый API restore.

## Ошибки, lifetime и recovery

Внутренний MODIFIER_INVALID превращается transport helper в HTTP400
VALIDATION_ERROR с непустыми structurally valid details.fields. Captured
index→key связывает options.index.field с исходной строкой; id conflict — с row
и сверкой, broad options — с heading, неизвестный path — с формой. Raw reasons,
codes, status и requestId не показываются. Известны только method-specific
404 MODIFIER_GROUP_NOT_FOUND, 409 MODIFIER_GROUP_ARCHIVED, для reorder также
MODIFIER_REORDER_INVALID. Endpoint mismatch и malformed fields не подтверждают
известный отказ. Прежняя product certainty сохранена: controller nonvalidation
без details сериализуется generic NOT_FOUND/CONFLICT и остаётся sent-unknown,
без угадывания product/category или причины 409.

Definitive rejection сохраняет draft/errors и требует свежего GET перед новым
намерением. Unknown сохраняет исходный состав/omissions/new keys/order readonly.
Явный recovery GET показывает текущие данные без replay/rebase, actor attribution
или связывания generated IDs; неудачный GET сохраняет lock. Явный выход закрывает
только local task; следующий create может продублировать эффект. Reorder можно
явно начать заново из нового полного baseline.

Session authenticatedGet/Command, admin/access identity и operation generation
проверяются до dispatch и публикации. Sent команда не повторяется. App получает
mutationEpoch при отправке и любом settlement, включая late/unknown; Availability
сохраняет собственную operation/recovery/generation и теряет только freshness.
Нет cross-patch, actor acknowledgment, global lock или изменения order snapshots.
Hidden page прекращает ordinary reads и focus; sent/recovery сохраняются.
Role/identity loss удаляет protected cache и late publication.

## Focus и проверка

Blur каждого поля/checkbox/radio передаёт типизированный target, исходную task
и актуальную revision через widget/page в один catalog owner. Текущий
`modifierFields` вычисляет те же field/row/aggregate ограничения, не меняя raw
draft и не отправляя запрос. Feedback появляется для touched полей и зависимых
границ; после Save — для всей формы. Изменение перепроверяет затронутый текущий
draft, сохраняет ошибки остальных submitted полей и не очищает чужой серверный
отказ до изменения его поля. Равные порядки отмечаются у обеих строк по keys.
Role/session/task/revision/modal/unknown lock запрещают устаревший blur.

Отдельный revision-bound focus signal создаётся только Save или конкретным
серверным отказом; изменение feedback на blur/typing не переводит focus.
Broad options error имеет один условный stable ID, связанный с section и
heading/focus target. Это markup/source, не наблюдение assistive поведения.
Нейтральный current-read group/options projection подготовлен в widget computed
с исходным порядком, IDs и полным составом; фильтрации в recovery template нет.

Вход create/edit фокусирует heading в обеих ширинах. Add/Вернуть — имя строки;
move — исходное действие или row на boundary; exclusion — соседнее имя/Add.
После render проверяются page/activity, revision/task, modal, surviving focus
и mounted owner. Checking/sending сохраняют mounted heading/actions с честным
disabled. Категории сохраняют wide originating row и narrow heading; товарный
entry/Restore не переписывается.

Существующие format/lint/typecheck/build и root/local docs checks обязательны.
Тесты запрещены. Полная U07 matrix: обе темы, 320/599/600/601/768/1023/1024/1025/1440,
short/long content, ошибки/modal/recovery/native radios/keyboard/assistive,
реальный 200% zoom и численный composited contrast, а также API/roles/adverse/
baseline/concurrency/lifetimes требуют настоящего наблюдения и независимого review.
Текущие OTP429, category live focus, privacy, schema/projection и capability gaps
не закрываются этим документом. Исторические approvals действуют только для
своих source snapshots. Общий back-office goal не завершён.

Назад к [архитектуре](INDEX.md).
