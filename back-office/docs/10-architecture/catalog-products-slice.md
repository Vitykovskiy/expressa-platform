---
title: "Товары и атомарные цены"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../backend/src/catalog/transport/catalog-products-v3.controller.ts
  - ../../../backend/src/catalog/domain/product-admin.policy.ts
  - ../../../backend/src/catalog/adapters/postgres-products.repository.ts
  - ../../src/entities/catalog/catalog.store.ts
  - ../../src/entities/catalog/product.api.ts
  - ../../src/entities/catalog/product.mapper.ts
  - ../../src/features/product-edit/ProductForm.vue
  - ../../src/pages/CatalogPage.vue
---

# Товары и атомарные цены

Administrator-раздел каталога дополнен созданием, полным редактированием,
архивированием и полным порядком товаров одной категории. Это описание
исходников; собственные наблюдения и независимая приёмка различаются.
Группы и добавки описаны в [modifier slice](catalog-modifiers-slice.md);
[связи категории](catalog-associations-slice.md) используют тот же owner.
Прямые связи товаров и push/PWA ещё не реализованы, независимая приёмка остаётся открытой.

## Владельцы и локальные режимы

`entities/catalog/` сохраняет один task/operation union категорий, товаров и групп,
одни access/read/operation epochs и одну выполняемую запись. Readonly selectors
`categoryTask`/`productTask` не создают копии бизнес-состояния. API и чистый
product mapper принадлежат entity; представление не отправляет HTTP.
`features/product-edit/` разделяет полную форму, pricing branch и вложенные
опции. Поиск, reorder, archive и `widgets/catalog/ProductList.vue` получают
readonly props и события. `ProductWorkspace.vue` компонует товарный list/form и
current-state без копии task; page оставляет режимы, modal/navigation/focus. Shared primitives, transport runtime и темы прежние.

Page хранит локальные Категории/Товары, search/category finding и modal state
по [системному контракту](../../../docs/50-interfaces/Back-office-UI.md#каталог).
Занятая задача блокирует новый выбор/режим до явного завершения или отмены.
Wide >=1024px допускает list/form в двух shrinkable зонах; ниже форма заменяет
список. Recovery может показывать текущий каталог отдельно от старого intent.
Перезагрузка открывает категории, без восстановления приватного draft.

## Цена, идентичность и полная запись

Новый товар начинается с пустых name/description/order/price и false-флагов;
категория предварительно выбрана только из намеренно выбранного finding context.
Edit копирует весь исходный product, child IDs и категорию. Name/description
остаются raw. Числа проверяются как int32 0..2147483647, цены — целые рубли.
GET DTO допускает непубликуемый товар без цены/опций; это не готовая ценовая
модель для сохранения. Null не подменяется нулём или выдуманной опцией.

Оба pricing draft сохраняются между переключениями. Single отправляет price,
нормализованный непустой optional portionLabel либо null и пустые priceChoices.
Choices отправляет null price/portionLabel и минимум две опции с различными
нормализованными ru-RU labels и порядками. Sparse order сохраняется; typing
не сортирует строки. Adjacent move меняет местами два валидных уникальных
порядка и positions, не renumber всего списка.

Ключ строки — локальный увеличиваемый номер, никогда не server UUID. Исходный
child ID неизменяем; новый child опускает id. Удалённый existing child остаётся
в отдельном несохранённом branch с «Вернуть». Save с исключёнными baseline IDs
открывает одно подтверждение исходных labels. Draft revision/ID должны совпасть;
изменение draft отменяет подтверждение. В одном full PATCH исключённые choices
архивируются. Restore/Undo после подтверждённой записи API не предоставляет.

POST201/full PATCH200/DELETE204 и category-scoped reorder POST200 используют
текущие v3 paths. Проверяется форма ответа и точное совпадение captured полей,
нормализации, исходных retained IDs, отсутствия omitted IDs и числа choices.
Новый ID должен быть неизвестным текущему каталогу UUID. New rows сверяются по
captured уникальному order и всем normalized полям внутри конкретного валидного
ответа; совпадение label само по себе не подтверждает ни ID, ни автора.
Reorder отправляет полный текущий набор категории, включая inactive, и принимает
только соответствующую перестановку с последовательным server sortOrder.

## Stale, ошибки и исход команды

Перед намеренной записью один GET сравнивает полный product/child baseline,
source/target категории; reorder сравнивает полный membership/поля/порядок.
Changed/missing source не отправляется. Это не CAS: GET-write race остаётся.
Проверка existing ID на frontend не исправляет repository fallback/revival
поведение; защита не заявляется как серверная гарантия.

Source-backed400 nested paths связываются с captured index→stable key.
Неизвестные поля относятся к форме; raw reason/code/HTTP не выводится.
Внутренний ProductAdminError не равен сериализованному HTTP code:
nonvalidation branch product controller отправляет `{code,message}` без details,
а зарегистрированный global exception filter сохраняет structured code только
с details. Поэтому actual404 имеет NOT_FOUND, actual409 — CONFLICT,
details:null/requestId. Они остаются sent-unknown по прежнему classifier;
клиент не угадывает отсутствие product/category или archive/position/reorder cause.
400 сохраняет VALIDATION_ERROR/details.fields. См. текущие
[controller](../../../backend/src/catalog/transport/catalog-products-v3.controller.ts),
[filter](../../../backend/src/platform/observability/unified-exception.filter.ts) и
[его регистрацию](../../../backend/src/platform/observability/observability-configuration.ts).
Это source fact, не live branch proof или закрытие матрицы.
Reorder membership может дать400; SQL position exception может дать500.
OpenAPI success-only inventory не превращается в придуманную error-schema.

Sent network/timeout/abort/5xx/invalid/wrong-context response остаётся unknown.
Один явный GET показывает текущие значения отдельно от readonly исходного draft,
без replay, rebase, category fallback или actor attribution. Неудачный recovery
сохраняет lock. Lost create и lost generated-choice update нельзя связать с
прочитанными ID по labels/values. Явный выход закрывает только локальную задачу;
новый edit/create/reorder — отдельное намерение.

Focus остаётся у стабильных headings/row keys при блокировке; ошибки и completion
фокусируют исходный task/confirmed row только пока сотрудник в этом контексте.
Product entry фокусирует heading формы и на wide, где исходная строка становится
disabled. Unsent Вернуть направляет focus в label восстановленной опции по её
стабильному draft key; в single branch — в текущую цену. Проверки текущего
task/baseline, доступности и surviving focus не перехватывают новую навигацию
или modal. Это описание реализации; независимая проверка и полная матрица
не подменяются данным утверждением.
Dialog закрывается при section exit, original sent operation остаётся у store.
Role/identity loss очищает protected cache/KeepAlive через текущий App owner.

## Соседние владельцы и граница доказательства

Один catalog mutationEpoch до dispatch и при settlement уведомляет Availability
через App. Его owner сохраняет свой original send/recovery и инвалидирует
freshness; прямого cache patch/cancellation sent command нет. Product own flag
и choice flags могут конфликтовать с отдельными оперативными командами, без CAS.
Исторические order snapshots не изменяются. Admin GET не содержит direct
productModifierGroups; UI не восстанавливает отсутствующие связи.

Применяются существующие format/lint/typecheck/build и docs checks; тесты запрещены.
Полная role/error/generation/concurrency/focus/assistive/theme-width/short/long/
200%zoom/composed-contrast матрица требует фактических наблюдений и независимого
review. Сохраняются все inherited evidence/capability/privacy/schema gaps,
stored-parent/public projection discrepancy и незавершённый общий goal.
Ни успешная сборка, ни этот документ не являются приёмкой.

Назад к [архитектуре](INDEX.md).
