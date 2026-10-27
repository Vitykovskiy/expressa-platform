---
title: "ADR-014: композиция back-office и текущий вход"
type: adr
area: architecture
status: accepted
owner: root
date: 2026-10-25
last_verified: 2026-10-25
sources:
  - ../../../AGENTS.md
  - ../../80-conventions/Code-Definition-of-Done-back-office.md
  - ../../50-interfaces/Back-office-UI.md
  - ../../../backend/openapi/openapi.json
  - ADR-011-back-office-clean-slate.md
  - ADR-012-back-office-source-contract.md
  - ADR-013-back-office-feature-organization.md
knowledge_role: decision
scope: back-office
---

# ADR-014: композиция back-office и текущий вход

## Уточнение маршрутизации

[ADR-016](ADR-016-back-office-vue-router.md) заменяет положения о root/query,
section selection и server404 для application paths: пять named routes,
RouterView и home redirect неизвестного пути. Остальные границы сохраняются;
ниже описаны исходное решение и его исторические наблюдения.

## Частичная замена от 25 октября 2026 года

Пути, FSD-направление и запрет отдельного layout в разделе «Экран и layout»
заменяются целевым [ADR-015](ADR-015-back-office-domain-structure.md).
Его независимое review предшествует зависимому переносу. Ниже сохранена история
прежнего размещения; граница props/events/slot и все требования текущего входа,
HTTP, session/native и перехода остаются действующими.

## Контекст

После рефакторинга пользователь потребовал убрать legacy во всём back-office
и отдельно уточнил, почему workspace с навигацией находится в `app`.
На момент решения `StaffWorkspace` объединяет пять рабочих страниц, их активацию,
отказ в доступе и фокус с каркасом, навигацией и действиями учётной записи.
Перенос целого компонента в `widgets` создал бы импорты верхнего слоя `pages`.

Существующие переходы `/queue`, `/availability`, `/menu` и восстановление
worker `/sw.js` обслуживают прежний клиент. При этом ответы действующих
команд accept/issue имеют собственную опубликованную форму: меньший номер
версии API сам по себе не делает операцию устаревшей.

Решение уточняет [ADR-013](ADR-013-back-office-feature-organization.md):
разделяет экран и layout, а в разделе «Переход» заменяет требование сохранять
устаревший публичный `/sw.js`. Остальные правила ADR-013, слои и технический
DoD сохраняются. Это принятый архитектурный целевой контракт; переносы и
удаления ещё не выполнены этой записью. Он не означает пользовательскую
приёмку, проверенный runtime или поставку.

## Решение

### Экран и layout

Сохраняем направление `app -> pages -> widgets -> features -> entities -> shared`
и локальную адаптацию FSD. Пути ниже указаны относительно `back-office/src`
и задают ответственность будущей
реализации; отдельный слой `layout`, framework, barrels, aliases и файлы-прокси
не вводятся.

| Целевой владелец                                                          | Ответственность                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main.ts`, `app/bootstrap.ts`, `app/theme.constants.ts`, `app/styles.css` | Единственный запуск, Pinia/Vuetify, тема, порядок глобальных CSS и монтирование.                                                                                                                                                           |
| `app/App.vue` и соседние контракты                                        | Композиция входа и staff-сеанса, ключ `ID:role:token`, restore/expiry/logout, URL/history, native intent lifetime, logout proof и фоновые сообщения.                                                                                       |
| `app/staff/StaffScreen.vue`, `StaffScreen.types.ts`                       | Композиция пяти рабочих страниц, проверка роли и отказ, `NotificationsDialog`, контекст страниц, активация catalog/settings/notifications, Catalog KeepAlive `max=1`, title и content focus. Заменяет `app/StaffWorkspace.vue` и его типы. |
| `widgets/staff/StaffWorkspaceLayout.vue`, `StaffWorkspaceLayout.types.ts` | Каркас workspace, существующая `StaffNavigation`, действия учётной записи, выбор уведомления и соответствующие адаптивные стили.                                                                                                           |
| `widgets/staff/StaffNavigation.vue` и соседние типы/константы/assets      | Существующая навигация, закрытый `StaffSection`, порядок разделов и иконки.                                                                                                                                                                |
| `app/staff/navigation.ts`, `navigation.types.ts`                          | Текущий URL intent разделов и cleanup popstate; переносятся из корня `app`. Навигация заказов остаётся в `pages/orders`.                                                                                                                   |
| `app/staff/useStaffDomains.ts`                                            | Сборка и срок жизни шести защищённых владельцев, синхронный сброс по ID/роли/token, общий expiry и invalidation доступности по catalog revision; перенос из корня `app`.                                                                   |

Пять импортов рабочих страниц orders/availability/catalog/users/settings остаются
в `app/staff/StaffScreen`. `App` подключает экран и staff helpers, экран —
страницы, layout и существующих нижних владельцев. Layout подключает навигацию
и соседние контракты; не импортирует `app`, страницы, store, HTTP или native
controller и не владеет history, title, фокусом либо cleanup сценария.
`SectionIntent` остаётся в `app`; нижний layout получает `StaffSection | null`
от существующего widget-владельца.

Layout получает явные readonly props:

- `administrator: boolean`, `section: StaffSection | null`;
- `links: Readonly<Record<StaffSection, string>>`;
- `notificationOrder: string | null`, `notificationMessage: string`;
- `navigationBusy: boolean`.

События: `navigate: [event: MouseEvent, href: string]`, `logout: []`,
`showNotifications: []`, `openNotification: []`. Экран обрабатывает команды
и сохраняет проверку модифицированного клика. Сеанс, token и store не передаются
в представление.

Один типизированный default slot принимает `NotificationsDialog`, затем
существующий `.staff-content` со страницами, KeepAlive и отказом. Content ref,
его стили и фокус остаются у экрана; frame/account/selection CSS — у layout.
Извлечение сохраняет DOM без дополнительной обёртки, порядок CSS и геометрию.
Не добавляются exposed focus method, registry рендера, копия состояния или
второй владелец бизнес-правила.

### Текущий вход и снятые переходы

Поддерживаемый вход собранного клиента через Nginx — `/` с текущими query/hash.
Сохраняются `/service-worker.js`, `/manifest.webmanifest`, текущие assets,
иконки, шрифт и корневой HTML-вход. Явная подготовка и регистрация текущего
push-only worker, проверка controller/origin/scope и протокол intent/proof
остаются у существующих владельцев.

Целевой результат для прежних входов:

- `/queue`, `/availability`, `/menu` возвращают 404 в собранном Nginx-клиенте.
  Удаляются их точные SPA locations, карта и вызов преобразования pathname
  перед mount. Redirect и переход в orders по умолчанию не добавляются.
- `/sw.js` возвращает 404 как отсутствующий статический файл. Удаляются
  прежний worker и bootstrap recovery с его константами. Нового migration shim,
  unregister, очистки кешей, авторизации или подписок не добавляется.

Удаление файлов не удаляет прежнюю browser-managed регистрацию. Она может
сохраниться; автоматическое обновление прежней установки при запуске больше
не обещается. Текущая проверка native intent не принимает старый controller;
явная подготовка текущих уведомлений остаётся действующим способом регистрации.
Общий history fallback dev-сервера Vite не задаёт контракт собранного Nginx.

### Действующие ответы заказов

Сохраняются `POST /api/v2/backoffice/orders/{orderId}/accept` и
`POST /api/v2/backoffice/orders/{orderId}/issue` из
[ADR-012](ADR-012-back-office-source-contract.md#actions) и текущего
[OpenAPI](../../../backend/openapi/openapi.json). Их
`BackofficeOrderDetailsResponseDto` содержит core заказа и customer ID/phone,
без `customer.name`, `pickupSlot` и `rejection` полного v3-ответа.

Выбор парсера остаётся явным по операции. Core-ответ проверяется на границе;
customer сверяется с отправленным заказом, отсутствующие v3-поля сохраняются
из захваченного исходного заказа. Проверки ID, ожидаемой стадии и отказа,
nullable/error/unknown semantics сохраняются. Это поддержка действующего HTTP,
а не резервный запрос к устаревшему read route.
`parseLegacyOrder` получает предметное имя `parseOrderCore`; адаптация ответа
остаётся. Новые v3 accept/issue endpoint и изменения backend не предполагаются.

## Переход

Нормативная запись и её независимое review предшествуют зависимому коду
текущего входа и разделению экрана/layout. Каждая предметная партия обновляет
фактические README, UI ownership, code-layout, PWA и COVERAGE только вместе
со своими реальными изменениями. До этого прежние пути в описании реализации
не выдаются за уже перенесённые. История ADR и наблюдений сохраняется.

Рефакторинг сохраняет серверную авторизацию, пять разделов администратора
и два бариста, отказ при неизвестном/пустом/дублированном `section`, допустимый
явный `section=orders`, текущие query/hash/history и нативные клики ссылок.
Ключ сеанса отзывает сохранённые страницы; защищённые владельцы очищаются
синхронно, поздние ответы не публикуются в новом контексте. Неактивные обычные
чтения прекращаются; отправленные команды и сверка остаются у их владельцев.
Сохраняются catalog KeepAlive, settings draft, catalog revision, title/focus
без перехвата фокуса фоновым сообщением, barista-only push и захват logout proof.
Телефон, OTP и token не попадают в URL/storage; не вводятся скрытые повторы
команд, запрос permission или подписка.

Применяются технический DoD, существующие нетестовые проверки и независимое
review. Видимое изменение требует финального осмотра после последних правок
и независимой визуальной проверки по
[стратегии проверки](../../40-quality/Validation-strategy.md#процесс-визуальной-работы).
Исходник и успешная сборка не подтверждают HTTP-404, нативную установку или
визуальную сохранность. Автоматизированные тесты запрещены до явной приёмки;
после неё требуют прямого запроса пользователя. Version/changelog/tag и
поставка не входят в эту внутреннюю переработку.

## Последствия

Путь чтения различает запуск, состав staff-экрана и адаптивный layout.
Новая конкретная граница props/events/slot отделяет независимую причину
изменения без смены framework, владельцев состояния или направления слоёв.
Целый workspace в `widgets` нарушил бы направление импортов; простое
переименование оставило бы смешанную ответственность и прежние переходы.

Прежние bookmarks и установки теряют автоматический переход намеренно.
Удаление core-парсера вместо его точного имени сломало бы действующие команды.
Решение пересматривается в затронутой части, если реализация требует обратного
импорта, нового бизнес-владельца, иной session/native семантики, обнаружен
действующий потребитель снимаемого URL либо изменён текущий HTTP-контракт.
Полная проверка back-office и независимая приёмка итоговой интеграции остаются
отдельными результатами; этот ADR не подтверждает отсутствие legacy повсюду.
