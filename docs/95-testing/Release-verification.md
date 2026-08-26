---
type: testing
owner: root
last_verified: 2026-08-25
sources:
  - ../_sources/Expressa_MVP_Техническое_задание.md
---

# Проверка готовности и выпуска

- **Q-SMOKE.** Чистая база проходит миграции, seed и полный API-маршрут до выдачи заказа.
- **Q-E2E.** Эпик [[../10-overview/backlog/E13/index|E13]] создаёт standalone-набор [`e2e`](../../e2e/README.md), который связывает создание меню, клиентский заказ, приготовление, оплату, выдачу и историю через UI подготовленных front-office и back-office.
- **Q-RELEASE.** Выпуск компонента фиксирует совпадающие версию пакета, Git-тег
  и запись `CHANGELOG.md`; составной staging-тег фиксирует совместимый набор
  трёх digest и результаты обязательных проверок.

## E04 — телефонная авторизация и доступ

Область проверки E04: local, CI и реальный Chromium-браузер. Для неё запускать
backend CI-эквивалент и браузерные auth-сценарии обоих клиентов.

- Состав эпика: [[../10-overview/backlog/E04/index|E04]].
- Backend: [CI](../../.github/workflows/backend-ci.yml), [auth E2E](../../backend/test/e2e/auth.e2e-spec.ts) и [PostgreSQL-интеграция](../../backend/test/integration/auth-repository.integration.spec.ts).
- Front-office: [CI](../../.github/workflows/front-office-ci.yml) и [реальный auth E2E](../../front-office/tests/e2e/auth.e2e.spec.ts).
- Back-office: [CI](../../.github/workflows/back-office-ci.yml) и [реальный auth и роли E2E](../../back-office/tests/e2e/auth.e2e.ts).

## E05 — публичное меню и локальная корзина

Область проверки E05: PostgreSQL read-model каталога, OpenAPI и реальный Chromium front-office. Проверка охватывает `DRINK`, товар без вариантов, обязательные добавки, локальную корзину и размеры `320`, `390`, `768`, `1280` px с проверкой до и после CSS-границ `480`, `768`, `1024` px.

- Backend: [CatalogModule](../../backend/src/catalog/catalog.module.ts), [сценарий публичного меню](../../backend/src/catalog/application/get-public-menu.use-case.spec.ts) и [OpenAPI](../../backend/openapi/openapi.json).
- Front-office: [публичное menu E2E](../../front-office/tests/e2e/menu.e2e.spec.ts) и [CI](../../.github/workflows/front-office-ci.yml).

## E06 — управление меню

Область проверки E06: PostgreSQL-команды каталога, OpenAPI, runtime back-office
и реальный Chromium-путь Administrator → backend → публичное меню. Сквозной
сценарий работает с back-office на `1280` px и проверяет результат во
front-office на `768`, `1280` и `1440` px; это фактические размеры E06, а не
общая матрица визуальных проверок клиентов.

- Backend: [admin catalog E2E](../../backend/test/e2e/admin-catalog.e2e-spec.ts), [интеграция схемы](../../backend/test/integration/catalog-admin-schema.integration.spec.ts) и [OpenAPI](../../backend/openapi/openapi.json).
- Back-office и front-office: [сквозной catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts) и [CI](../../.github/workflows/back-office-ci.yml).

## E07 — корзина и создание заказа

Область проверки E07: миграция схемы заказов, атомарная серверная актуализация и
снимки, customer-only `POST /api/v1/orders`, идемпотентность и реальный Chromium
checkout. Browser suite содержит шесть сценариев: путь гостя через OTP, изменение
цены, недоступный вариант, закрытый приём, потерю ответа с повтором и адаптивную
проверку. Последняя проходит на `320`, `390`, `479`, `480`, `767`, `768`, `1023`,
`1024`, `1280` и `1440` px.

- Backend: [create-order E2E](../../backend/test/e2e/create-order.e2e-spec.ts),
  [схема PostgreSQL](../../backend/test/integration/orders-schema.integration.spec.ts),
  [unit of work](../../backend/test/integration/order-unit-of-work.integration.spec.ts)
  и [OpenAPI](../../backend/openapi/openapi.json).
- Front-office: [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts)
  и [CI](../../.github/workflows/front-office-ci.yml).

## E08–E09 — очередь, выдача и оплата при получении

Реальный Chromium создаёт заказ через front-office, проверяет видимость блока
оплаты в корзине, затем сотрудник проводит заказ через `CREATED` →
`ACCEPTED` → `PREPARING` → `READY` → `ISSUED` и видит события. Сценарий также
проверяет отказ customer и недопустимого `issue`; после отказа заказ остаётся
`READY`. Запуск: `cd back-office && npx playwright test --config
playwright.orders.config.ts`. [E2E](../../back-office/tests/e2e/orders.e2e.ts), [конфигурация](../../back-office/playwright.orders.config.ts).

## E10–E11 — собственные заказы, уведомления и доступность

Customer API возвращает только собственные текущие и исторические заказы;
front-office проверяет polling, pagination и повтор по актуальному меню. Push
требует явного действия customer и не меняет результат создания или перехода.
Barista управляет доступностью и приёмом новых заказов через защищённый API.
[Orders E2E](../../backend/test/e2e/create-order.e2e-spec.ts), [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts), [availability E2E](../../back-office/tests/e2e/orders.e2e.ts).

## E13 — standalone Q-E2E

E13 содержит POM, fixtures, тестовые данные и пять независимых UI-only
Playwright-сценариев `JOURNEY-01`—`JOURNEY-05` в standalone-наборе
[`e2e`](../../e2e/README.md). Они связывают administrator, customer и staff
через UI подготовленных клиентов: от публикации напитка до чтения customer
неизменяемого снимка выданного заказа в истории. Переход `READY` → `ISSUED`
проверяется после внешней оплаты без отдельного UI-состояния оплаты.

После push в `main` workflow запускает набор на временном VPS-стенде дважды
подряд и публикует последний отчёт либо диагностическую страницу до запуска
Playwright. Q-E2E и задачи E13 становятся доказанными только по двум
последовательным успешным реальным прогонам; конфигурация без такого evidence
не является завершением эпика. [Порядок VPS-проверки](../70-deployment/E2E-on-VPS.md).

## E12 — нормативная приёмка

Q-SMOKE запускает миграции, дважды выполняет идемпотентный seed и проводит
заказ API до `ISSUED`. E12 принимает успешный Q-E2E из E13 как доказательство
для совместимого набора версий.
Внешние проверки backup/restore, alert delivery, staging и production не
подменяются локальными тестами: их статус фиксируется в карте доказательств.

## Definition of Ready

Задача готова к разработке, когда содержит:

- связь с эпиком и требованиями;
- один основной результат;
- конкретный контур;
- критерии приёмки;
- зависимости;
- API-контракт либо описание runtime UI для интерфейсной задачи;
- тестовые сценарии;
- перечень документации, которую обновляет реализация;
- размер, подходящий для одного pull request либо явно разделённый на последовательные задачи.

## Definition of Done

Задача завершена, когда:

- код проходит review;
- lint, typecheck, тесты и build проходят в CI;
- доменные правила покрыты автоматическими тестами;
- UI проверен в runtime;
- OpenAPI отражает актуальный backend-контракт;
- миграции применяются на чистой и рабочей тестовой базе;
- документация репозитория соответствует коду;
- ошибки содержат диагностический `requestId`;
- функциональность подтверждена в `development`, а версия для демонстрации — в `staging`;
- выпуск с UI-изменениями требует свежего положительного вердикта обязательной
  [[../40-quality/Definition-of-done#Браузерная UI-приёмка|браузерной UI-приёмки]];
- при выпуске компонента версия в `package.json`, Git-тег и запись в
  `CHANGELOG.md` совпадают; составной staging-тег записан в `CHANGELOG.md` и
  может повторно поставить неизменные digest без изменения версий компонентов;
- критерии приёмки задачи выполнены.

## Критерии приёмки MVP

1. Три репозитория разворачиваются и поставляются автономно.
2. Все команды используют npm и воспроизводимый lock-файл.
3. Runtime-проверки клиентов заменяют исторический Storybook согласно [ADR-004](../20-architecture/ADR/ADR-004-remove-storybook.md).
4. Customer открывает меню, видит заранее выбранный доступный размер напитка и обязательные добавки, при необходимости меняет их, формирует корзину и авторизуется по телефону.
5. Backend проверяет цены и доступность и создаёт идемпотентный заказ.
6. Barista видит новый заказ и проводит его через все стадии.
7. После получения оплаты сотрудник переводит заказ из стадии `Готов` в стадию `Выдан`.
8. Customer видит текущий статус и историю.
9. Customer повторяет выданный заказ; корзина учитывает текущие цены и доступность.
10. Customer получает push-уведомления о стадиях `Принят`, `Готов` и `Выдан`.
11. Barista получает push-уведомление о новом заказе.
12. Administrator управляет категориями, товарами, размерами напитков, добавками и ценами.
13. Barista управляет доступностью и приёмом новых заказов.
14. Аудит содержит сотрудников и время критических действий.
15. Полный smoke-сценарий проходит на чистой базе, в `development` и `staging`.
16. CI каждого репозитория выполняет обязательные проверки.
17. Документация каждого репозитория соответствует выпущенному коду.
18. `staging` разворачивается только по Git-тегам версий и хранит точный набор версий трёх сервисов.

## Внешние входные данные к выпуску

- доменные имена front-office, back-office и backend;
- доступ к VPS и DNS;
- учётные данные production SMS-провайдера;
- телефон первого administrator;
- телефоны barista;
- фирменные логотипы, шрифтовая и цветовая база;
- тексты меню и цены;
- политика обработки персональных данных и пользовательские тексты согласия.

Связанные эпики: [[../10-overview/Epic-roadmap]]. Правила выпуска: [[../70-deployment/Release-and-version-compatibility]].
