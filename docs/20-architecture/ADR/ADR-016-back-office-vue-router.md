---
title: "ADR-016: Vue Router для back-office"
type: adr
area: architecture
status: accepted
owner: root
date: 2026-10-26
last_verified: 2026-10-26
sources:
  - ../../../AGENTS.md
  - ../../50-interfaces/Back-office-UI.md
  - ../../80-conventions/Code-Definition-of-Done-back-office.md
  - ADR-015-back-office-domain-structure.md
knowledge_role: decision
scope: back-office
---

# ADR-016: Vue Router для back-office

## Контекст

Пользователь поручил Vue Router и уточнил результат: пять настоящих маршрутов,
без выбора страницы через section query. Неизвестный маршрут должен переводить
на главную стандартным redirect. Это исправляет прежнее решение этого ADR;
его прежняя проверка не является приёмкой исправления.

## Решение

Сохраняем точную зависимость vue-router5.4.0 и createWebHistory.
Bootstrap создаёт persistent App, подключает router и ожидает isReady до mount.
Пять именованных записей непосредственно выбирают компоненты:
/orders → orders → OrdersRoute; /availability → availability → AvailabilityPage;
/catalog → catalog → CatalogPage; /users → users → UsersRoute;
/settings → settings → SettingsRoute. Заголовок и administratorOnly принадлежат
metadata записей. AppContent показывает matched Component через RouterView,
проверяя доступ до mount. Запрещённый известный путь сохраняется с отказом.

`/` переводит на named orders, сохраняя query/hash кроме obsolete section.
Catch-all `/:pathMatch(.*)*` переводит на orders с пустыми query/hash.
Страницы404 и собственного pathname matcher нет. Optional trailing slash
обрабатывает Vue Router. section-query, SectionIntent и фиктивные origins
удаляются; section больше не выбирает страницу и опускается в новых ссылках.
Orders валидирует только бизнес-параметры normalized route.query:
undefined — отсутствие; bare/null, пустые и повторённые значения недопустимы.
Ограничения number/stage/order сохраняются. Hash-only не запускает чтение.
Named RouterLink/push сохраняют unrelated query arrays и hash при обычной
навигации. Layout получает metadata-derived ссылки/названия, сохраняет иконки
и не импортирует app singleton. Ошибки переходов не повторяют команды.

App остаётся владельцем session/native/background lifetime. AppContent имеет
ключ ID/role/token; внутри RouterView кешируется только CatalogPage (max1).
Auth cache отдельный. Настройки/заказы сохраняют состояние у прежних владельцев.
CatalogPage при деактивации снимает Teleport/selector представление, сохраняя
черновик. Vuetify VDialog/VMenu.closeOnBack=false сохраняет штатный Back.
Session/proof/controller/busy/single-consume проверки неизменны; explicit native
open направляет на orders с UUID, без replay после ошибки. Worker признаёт
same-origin root и пять путей с optional slash; fallback — /orders?order=UUID.
Manifest start_url остаётся `/`.

Nginx передаёт application paths в index.html напрямую, без directory-first
проверки /orders,/users,/catalog. Неизвестный application path, включая
/unknown.route, доходит до catch-all. API и health сохраняют свои ответы.
Namespaces assets/fonts/pwa/operations и известные расширения ресурсов
сохраняют static404 для отсутствующих файлов; worker/manifest/cache/security
контракты сохраняются. Vite не заменяет проверку собранного Nginx.

## Переход и проверка

Уточняются navigation/bootstrap положения ADR-014/015, public URL контракт,
README, coverage и затронутые карты владельцев. Бизнес/API/session границы
сохраняются. Применяются существующие format/lint/typecheck/build/docs checks
и ручная проверка desktop/mobile, ролей, history, query, кеша, native и direct
entry. Непроверенное явно остаётся ограничением. Автоматизированные тесты,
новые проверочные скрипты, выпуск/version/changelog/tag и deploy не разрешены
этой задачей. Независимая проверка и пользовательская приёмка отдельны.

## Последствия

Vue Router выбирает страницы и владеет навигацией. Модуль заказов отвечает
только за бизнес-query. Изменён публичный URL, поэтому worker и server входят
в единый пакет. Решение пересматривается при нарушении этих границ или
необходимости изменить исключённые бизнес/API/dependency обязанности.
