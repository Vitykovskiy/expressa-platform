---
title: "Оперативная доступность и приём заказов"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/40-features/Manage-availability.md
  - ../../../docs/50-interfaces/Back-office-UI.md
  - ../../../backend/openapi/openapi.json
  - ../../src/entities/availability/availability.types.ts
  - ../../src/entities/availability/availability.validation.ts
  - ../../src/entities/availability/availability.mapper.ts
  - ../../src/entities/availability/availability.filter.ts
  - ../../src/entities/availability/availability.api.ts
  - ../../src/entities/availability/availability.store.ts
  - ../../src/pages/AvailabilityPage.vue
  - ../../src/widgets/availability/AvailabilityTargets.vue
  - ../../src/features/availability-change/AvailabilityChange.vue
  - ../../src/features/availability-change/AvailabilityOperation.vue
  - ../../src/features/availability-search/AvailabilitySearch.vue
---

# Оперативная доступность и приём заказов

Добавлен отдельный staff-раздел. D07/2 расширяет только тип
`ApiRequest.method` литералом PATCH; runtime транспорта сохранён. В текущей
локальной среде наблюдены валидный GET, product/price-choice/modifier/intake
PATCH, сохранение локальных фильтров при возврате и GET-восстановление
неподтверждённого intake из другого раздела без повторения PATCH.
Полная runtime-матрица и независимая приёмка остаются открытыми; наблюдения
не доказывают все поздние ответы, ошибки, роли и межраздельные lifetimes.

## Владельцы и поток данных

`entities/availability/` владеет DTO, проверкой неизвестного ответа, чистым
mapper, фильтрацией модели, API и одним Pinia store. `pages/AvailabilityPage.vue`
соединяет readonly состояние с представлением, хранит локальные mode/search/category
drafts и отменяет обычное чтение при деактивации. `widgets/availability/`
показывает группы и реальные связи, `features/availability-search/` сообщает
намерения фильтрации, `features/availability-change/` — scalar intent и GET-recovery.
Ни один из этих отображающих компонентов не обращается к API.

GET v2 проходит проверку всех восьми обязательных членов, nullable intake,
UUID, boolean, числовых ограничений, уникальных идентификаторов и связей до
публикации модели. Mapper связывает категории/товары/ценовые опции и объединяет
категорийные и прямые связи группы по идентичности товара. Ввод поиска
не отправляет запрос: local substring пересекается с выбранной категорией.
Исходные description/default/min/max остаются проверяемыми DTO-полями;
отсутствующие audit/portion поля не создаются для представления.

## Команды и восстановление

Product/modifier и intake используют существующие v2 PATCH; price-choice —
v3 PATCH. Для price-choice отсутствует response-schema OpenAPI: локальная
проверка `{type:'price_choice',id,isAvailable}` основана на текущем runtime-пути
controller → use case → repository после COMMIT, а не на придуманной схеме.
Подтверждение требует исходный kind/id и запрошенный boolean. Intake проверяет
все собственные поля и флаг; author/time показываются только из ответа.

Store сохраняет исходные kind/id/label/previous/requested, инвалидирует старый
обычный GET и допускает одну активную availability-команду. Подтверждённый
переключатель не изменяется до валидного ответа. Отправленный неподтверждённый
исход блокирует новые команды этой области; одна явная сверка читает весь
актуальный GET без повторения PATCH. Полученное значение нейтрально завершает
сверку, даже когда флаг иной или объект исчез. Неудачная сверка сохраняет
идентичность и блокировку. Обычный failed refresh оставляет данные как
last-confirmed и запрещает изменения до успешного чтения.

Session остаётся единственным auth/token владельцем. Потеря staff-состояния
очищает store и инвалидирует поздние исходы. Availability lock не блокирует
order-команды; intake false не изменяет lifecycle существующих заказов.

## Разделы и ограничения

Administrator [catalog/category slice](catalog-categories-slice.md) и
[product slice](catalog-products-slice.md) и [modifier slice](catalog-modifiers-slice.md)
и [category association slice](catalog-associations-slice.md)
используют одну catalog task/cache-границу. Каталог имеет отдельную
защищённую cache-границу. Его mutationEpoch перед отправкой и при settlement
вызывает availability.invalidateCatalog через App: ordinary read отменяется,
fresh=false, данные и original operation сохраняются. Отдельный freshness epoch
не позволяет ordinary/recovery GET, пересёкшему invalidation, публиковать fresh.
Активная unlocked страница обновляется через свой owner, inactive ждёт activation;
locked operation сохраняет единственный read-recovery. Scalar settlement
не делает инвалидированный полный каталог свежим.

Долговременный [URL-контракт](../../../docs/50-interfaces/Back-office-UI.md#навигация-сотрудника)
принадлежит системному UI-документу. App сохраняет Orders и Availability через KeepAlive,
один заголовок/title и реальные ссылки; inactive Orders прекращает обычные
reads/polling/media/visibility effects, сохраняя order operation в прежнем store.
У незавершённой операции одно представление: local row/page либо оболочка
другого раздела. Это поведение исходников ещё требует живой проверки.

Собственные flags и active/context не равны обещанию общей возможности заказа.
Сохраняется источник-дефект S05-AVAILABILITY-RELATION-01: public multi-choice
projection использует child availability, а создание отдельно проверяет stored
parent. Backend не изменён; frontend эту несогласованность не исправляет.

Полные D06-EVIDENCE-01, R02-EVIDENCE-01 и D02-CAP-01/D02-OBS-01/D02-SKILL-01
остаются открытыми, как и исторический D06-PRIVATE-OUTPUT-01. Автоматизированные
тесты не создаются и не запускаются. Независимая приёмка и весь back-office
не завершены.

Назад к [карте](../INDEX.md).
