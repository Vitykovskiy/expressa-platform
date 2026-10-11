---
title: "Каталог и категории"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../docs/40-features/Manage-menu.md
  - ../../../backend/openapi/openapi.json
  - ../../src/entities/catalog/catalog.store.ts
  - ../../src/entities/catalog/catalog.api.ts
  - ../../src/entities/catalog/catalog.validation.ts
  - ../../src/pages/CatalogPage.vue
  - ../../src/widgets/catalog/CategoryList.vue
  - ../../src/app/App.vue
---

# Каталог и категории

Реализован administrator-раздел чтения каталога и управления категориями.
Проверки исходников и ручные наблюдения не являются независимой приёмкой.
Товары и атомарные цены дополнены в [product slice](catalog-products-slice.md).
Группы и атомарный состав описаны в [modifier slice](catalog-modifiers-slice.md).
[Связи категории с группами](catalog-associations-slice.md) занимают отдельную
задачу того же owner. Прямые связи товаров и push/PWA ещё не реализованы; общий back-office и независимая приёмка
остаются незавершёнными.

## Владельцы

`entities/catalog/` владеет неизвестным DTO, валидацией, mapper, API, одним
Pinia store, draft и исходом команды. Category/product/modifier task union имеет одного
владельца; readonly category selector сохраняет прежние category-команды. `pages/CatalogPage.vue` соединяет owner
с представлением, локальным поиском, фокусом и archive-dialog. Занятые
`features/category-edit/`, `category-search/`, `category-reorder/`,
`category-archive/` и `widgets/catalog/` получают readonly props и события;
API и изменяемых бизнес-копий у них нет. Shared transport изменён только
добавлением DELETE и PUT к существующему optional method; runtime сохранён.

GET v3 проверяет весь текущий пяти-массивный AdminCatalogV3Dto, вложенные
priceChoices, nullable price/portionLabel, UUID, уникальность и реальные
ссылки до публикации. Категории сортируются по sortOrder, затем UUID.
Отсутствующие productModifierGroups, audit и archive-поля не создаются.
Неполная OpenAPI-инвентаризация administrator GET не отменяет текущие guards.

## Draft и команды

Wide entry сохраняет focus на исходной selected строке списка; narrow entry
направляет его в heading формы. Во время занятой задачи selected строка остаётся
focusable с aria-disabled, а остальные строки native disabled. List не испускает
selection при disabled, store сохраняет единственную task/access/freshness guard.
После render page проверяет исходную task, активный контекст, modal и surviving
focus перед handoff. Это описание реализации; полная матрица и независимая
приёмка остаются отдельными требованиями.

Создание начинается с пустых name/description/order и isActive=false.
Редактирование копирует ровно четыре действительных поля; multiline
description и raw name сохраняются. Порядок вводится строкой и проверяется
как целое 0..2147483647; пустота и дробь не заменяются нулём.
Dirty draft не перезаписывается чтением или выбором другой задачи.
Поиск не отправляет запросы. URL и memory-контракт принадлежат
[системному UI-документу](../../../docs/50-interfaces/Back-office-UI.md#навигация-сотрудника).

Одна явная команда сохраняет intent/baseline и читает актуальный GET.
Edit/archive сравнивают исходную UUID и четыре поля; reorder — полный набор,
порядок и поля всех текущих unarchived категорий, включая inactive.
Изменённый baseline не отправляется. Checking отличается от sending;
draft на это время readonly, навигация сохраняется.
Перед блокировкой сфокусированного control форма/reorder синхронно переводят
фокус на собственный стабильный heading; действия остаются видимыми при
checking/sending. Archive сохраняет фокус на поверхности своего dialog.
Field-linked отказ переводит фокус на первое ошибочное поле только пока фокус
остаётся в форме. Успех возвращает его к подтверждённой строке либо heading
списка только из исходного form/reorder/dialog. Переход в поиск или другой
раздел не возвращает фокус автоматически.
GET preflight не предоставляет CAS: race между чтением и записью остаётся,
защита от lost update нескольких администраторов не заявляется.

Текущие v2 POST201/create, full PATCH200/edit, POST200/reorder и DELETE204/archive
отправляются ровно один раз. Create проверяет новый UUID и captured поля;
edit — исходный UUID и поля; reorder — всю уникальную перестановку и
последовательный server sortOrder; archive — ожидаемый пустой 204.
Archive убирает только категорию из локальной модели и делает полный каталог
stale до API reread. Он не выполняет клиентский cascade или restore.

Известные validation/position/reorder/not-found/archived отказы сохраняют
draft и показывают безопасные field/code решения. Network, timeout,
5xx и неправильный успешный ответ не считаются успехом. Отправленные
POST/PATCH/DELETE не повторяются; один explicit GET выполняет сверку.
Неудачная сверка сохраняет lock и исходную identity. Успешная показывает
текущие значения нейтрально, сохраняя старый readonly draft/permutation.
Возврат либо новый reorder — отдельное намерение без автоматического reapply.

Unknown create не имеет trusted нового ID. Name matching не используется.
После валидного GET состояние остаётся reconciled_ambiguous_create; только
явный «Вернуться к категориям» оставляет readonly abandoned snapshot и
закрывает локальную задачу при свежих данных и действующей роли. Это не
доказывает server outcome. Следующее Add создаёт отдельную пустую задачу.

## Доступ и соседний cache

Session остаётся единственным auth/token owner. Перед отправкой callback,
в том числе после refresh, и перед публикацией проверяются access epoch и
актуальный administrator ID. App synchronously отслеживает status/id/role;
потеря administrator либо смена ID очищает store и уничтожает его отдельную
KeepAlive-границу. Поздние отправленные ответы игнорируются. Деактивация
страницы отменяет ordinary GET, закрывает dialog и сохраняет sent operation.
Единственный operation-context показывается в странице/dialog либо оболочке
другого раздела. Barista direct address имеет один контекстный возврат,
без CatalogPage/cache/request; customer сохраняет прежний session denial.

App соединяет readonly mutationEpoch с availability.invalidateCatalog до
dispatch и при settlement, включая late/unknown. Каталог не импортирует
availability. Соседний owner сохраняет данные и original operation, отменяет
ordinary GET и проверяет отдельный freshness epoch. Пересекающий invalidation
GET не публикует свежесть. Активная unlocked страница читает обычный API;
неактивная ждёт activation; locked recovery сохраняет единственную сверку.
Scalar settlement не делает stale полный каталог fresh.

## Проверка и ограничения

Применяются текущие format/lint/typecheck/build и root/back-office docs checks,
ручной live UI и независимый review. Тесты запрещены. Полные transient,
concurrency, роли, zoom, contrast и assistive criteria требуют собственных
наблюдений; исходники и частичные captures их не закрывают.
Сохраняются inherited capability/observation/privacy gaps и backend
S05-AVAILABILITY-RELATION-01; frontend не обещает universal orderability.

Назад к [архитектуре](INDEX.md).
