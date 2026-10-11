---
title: "Связи категории с группами добавок"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../backend/src/catalog/transport/catalog-category-modifiers.controller.ts
  - ../../../backend/src/catalog/application/manage-category-modifiers.use-case.ts
  - ../../../backend/src/catalog/adapters/postgres-category-modifiers.repository.ts
  - ../../../backend/src/catalog/adapters/postgres-admin-catalog.repository.ts
  - ../../src/entities/catalog/catalog.store.ts
  - ../../src/entities/catalog/category-association.api.ts
  - ../../src/entities/catalog/category-association.mapper.ts
  - ../../src/features/category-group-assignment/CategoryGroupAssignment.vue
  - ../../src/pages/CatalogPage.vue
---

# Связи категории с группами добавок

Это описание исходников administrator-замены полного состава и порядка групп
одной категории. Живой UI и реальная команда этой итерации не наблюдены;
полная матрица и независимая приёмка открыты. Прямые связи товаров и push/PWA
остаются незавершёнными.

## Владельцы и вход

В Categories у фактической строки есть отдельное действие «Группы добавок»,
с именем, активностью, порядком и позицией для различения одинаковых названий.
Оно не вложено в кнопку category edit. Один catalog store расширяет существующие
task/intent/command-response unions; `associationTask` — readonly selector.
Вход требует administrator, свежий источник и отсутствие занятой задачи.
Заголовок получает focus на обеих ширинах. Обычный category wide originating-row /
narrow-heading и product/modifier entry не заменены этим правилом.

`features/category-group-assignment/` получает readonly данные и typed events.
Assignment компонует выбранный список и finder; Selection и Finder отвечают
за собственное представление. Локальный query принадлежит Finder и не меняет
бизнес-состав. Confirmation показывает captured intent. Operation представляет
единственный исход в CatalogOperation, в том числе вне раздела через App.
`widgets/catalog/AssociationCurrent.vue` готовит current-state projection
в computed отдельно от исходного желаемого массива. HTTP и состояние остаются
в entity; второго store или command engine нет.

Wide от 1024 px имеет максимум category list/editor, narrow заменяет список
редактором, включая recovery. Selected и finder расположены вертикально;
длинные имена переносятся в обычном документном scroll. Используются текущие
tokens, UiTextField, UiButton, UiDialog и native row actions, без новой палитры
или shared primitive.

## Источник, локальный состав и подтверждение

Visible source links проверяются на current category/group membership,
уникальные group IDs и уникальные nonnegative int32 sortOrder. Порядок определяется
исходным sortOrder, включая пропуски; ties не разрешаются UUID tie-break.
Категория и исходные triples сохраняются отдельно от desired IDs. Для исходных
и добавленных групп копируются все parent/options fields. Intent сравнивает
original и desired группы; изменения иных кандидатов не заменяют draft.

Inactive current категории и группы допустимы. Candidate search — substring
имени, исключаются только selected IDs. Add/re-add дописывает тот же UUID в конец;
remove исключает только локальную связь; explicit move меняет positions IDs.
Поля групп и sortOrder источника не редактируются. Search/blur/local changes/cancel
не отправляют PUT. Keys — реальные UUID, не позиции или имена.

Save доступен и при видимом равенстве или пустом массиве. Это исключение только
для deliberate full replacement; обычные dirty guards прежних задач сохранены.
Каждый Save создаёт одно confirmation с category/access identity, desired IDs
и revision. Подтверждение показывает полный captured ordered состав с inactive
markers, включая targeted copy о скрытых архивных связях; пустой состав имеет
вопрос «Убрать все связи категории?» без вымышленных строк.
Confirm проверяет исходную identity/revision/IDs и одноразово переходит в preflight.
Modal блокирует underlying Save; уход из контекста отменяет unsent confirmation.

## Полная замена, HTTP и certainty

Единственная команда — PUT
`/api/v2/backoffice/catalog/categories/{categoryId}/modifier-groups`,
body только `{groupIds}`, expected200 triples. Общий ApiRequest.method
расширен только литералом PUT; transport runtime/credentials/headers/defaultGET
не меняются. Backend удаляет все category relations и вставляет desired IDs
с zero-based sortOrder, в том числе удаляет скрытые архивные связи.
V3 admin GET скрывает links к archived groups. Он не доказывает полный stored
baseline, отсутствие скрытых связей или server no-op.

Authenticated full GET preflight сравнивает target category fields, ordered
visible triples, все relevant parent/options fields и desired eligibility.
Изменённый/отсутствующий/несогласованный источник запрещает запись и сохраняет
readonly draft. Session/access/operation epochs проверяются после чтения,
после session refresh перед единственным send и перед публикацией.
GET-write race сохраняется: CAS, hidden snapshot и idempotency не заявляются.

Specific200 принимается только при точной длине, включая [], исходной category
UUID, exact unique captured group IDs в desired order и sortOrder=index.
Malformed/count/parent/member/order mismatch остаётся sent-unknown.
Валидный ответ заменяет только target visible triples и делает полный каталог
stale; actual categories/groups/options/products сохраняются до fresh GET.
Активная страница выполняет обычный refresh; неактивная ждёт activation.
MutationEpoch перед dispatch и при любом settlement, включая late/unknown,
сохраняет прежнюю App invalidation Availability freshness без reset её операции
или Orders context.

Known400 требует VALIDATION_ERROR и structurally valid nonempty details.fields.
GroupIds rejection связан со selected section/heading stable error ID;
categoryId — с original target, requestId/unknown path — с формой.
Raw reason/code/status/requestId не выводятся. Category404 известен только
как CATEGORY_NOT_FOUND/details:null; association-specific409 отсутствует.
Sent401/403/5xx/network/timeout/abort/nonJSON/invalid/unrecognized ответ неизвестен,
без retry и guessed named cause. Прежняя product generic404/409 uncertainty
и modifier-specific certainty не расширены этим classifier.

Отказ сохраняет desired IDs/order/feedback; новый write требует fresh read.
Только содержательное изменение selected membership/order очищает membership
ошибку; finder typing/blur её не очищает. Unknown сохраняет original intent
readonly; одна явная GET-сверка показывает current visible array отдельно.
Failed read или ties остаются locked. Совпадение, отсутствие и действия другого
администратора не доказывают исход своей записи. После valid read явный возврат
закрывает только local task; replay/rebase/merge/fallback отсутствуют.

Замена не архивирует группы/добавки, не удаляет direct product links и не
меняет исторические order values. Public eligibility/orderability и текущий
stored-parent projection defect не исправляются клиентом.

## Focus и граница доказательства

Add/re-add переводит focus в actual selected UUID row; move сохраняет native
action даже на boundary, где aria-disabled action не отправляет change.
Remove выбирает соседнюю строку либо finder. Cancel возвращает origin action,
category row или list heading. Checking имеет mounted task heading; errors
направляют focus только при сохранённом исходном контексте, без blur transfer.
Completion переводит focus только из собственного task/dialog после проверки
исходной operation/user identity, active/navigation, category mode, отсутствия
новой задачи/modal и сохранённого focus. Native association action выбирается
только если она существует и не disabled; иначе focus синхронно получает
category list heading. После valid200 каталог stale, поэтому mutations остаются
disabled, а heading доступен сразу и сохраняется при обычном refresh, его ошибке
или отсутствии исходной строки. Завершение refresh не запускает поздний перенос
focus. Это описание исходников; success/failed-refresh/missing-row и отсутствие
focus theft ещё требуют живого наблюдения.

Существующие format/lint/typecheck/build и root/back-office docs checks
не заменяют весь U08 и inherited role/API/error/held/rapid/processed-lost/baseline/
failed-read/late-access/generation/sibling matrix, обе темы на
320/599/600/601/768/1023/1024/1025/1440, short viewport, empty/one/many/no-group/
no-match/inactive/duplicate-long/errors/checking/sending/unknown/reconcile/modal,
keyboard/focus/scroll/assistive/real200%zoom/numerical composed contrast.
Current safe auth/capability, category own-live focus, privacy и backend/schema
ограничения остаются открытыми. Tests запрещены. Этот документ не принимает UI.

Назад к [архитектуре](INDEX.md).
