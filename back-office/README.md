# Back-office Expressa

Автономный клиент сотрудника на Vue 3, Vuetify, TypeScript, Vite и Pinia.
Реализованы настоящий вход сотрудника, заказы, доступность и административные
меню, пользователи и настройки. Администратор видит пять разделов, бариста —
заказы и доступность. Все данные и изменения используют действующий backend;
локального CRUD или демонстрационных строк нет. Полный интегрированный результат
требует независимой проверки и development-поставки; пользовательская приёмка
не заявляется.

## Структура каталога

```text
back-office/
├── src/
│   ├── app/            # запуск, выбор входа/рабочего содержимого, URL и lifetime
│   ├── layouts/        # общий AppLayout, AppNavigation и их assets
│   ├── modules/        # auth, session, orders, availability, catalog, users,
│   │                  # settings, notifications; дочерний UI в components
│   └── shared/         # технический HTTP и переиспользуемые UI-примитивы
├── public/             # шрифт, manifest, исходные иконки и push-only service worker
└── docs/               # владельцы состояния, HTTP, установка и актуальный реестр покрытия
```

Предметная структура следует
[ADR-015](../docs/20-architecture/ADR/ADR-015-back-office-domain-structure.md).
Сначала выберите бизнес-область в `modules`, затем файл по обязанности:
Page/Route, store, API, mapper или дочерний компонент. Глобальных FSD-слоёв
и пустых каталогов нет; соседние типы/константы остаются у своего владельца.
Vue Router 5.4.0 выбирает пять страниц: /orders, /availability, /catalog,
/users, /settings. `/` переводит на orders; неизвестный application path —
на чистый orders. Бизнес-query заказов проверяет orders-navigation;
bootstrap ожидает router readiness перед mount persistent App. Решение —
[ADR-016](../docs/20-architecture/ADR/ADR-016-back-office-vue-router.md).
Точное направление импортов и исключения session — в
[размещении кода](docs/80-conventions/code-layout.md).

`app/App.vue` выбирает вход или рабочее содержимое и сохраняет сеанс/native
lifetime. `app/AppContent.vue` компонует страницы, доступ, активацию и фокус;
`layouts/AppLayout.vue` отображает общий авторизованный каркас через
props/events/default slot. Вход имеет прежнее самостоятельное представление,
защищённая навигация до авторизации не появляется.

Четыре пути для первого чтения:

- Каркас: [AppLayout](src/layouts/AppLayout.vue),
  [AppNavigation](src/layouts/AppNavigation.vue), затем
  [AppContent](src/app/AppContent.vue) с содержимым и lifecycle.
- Заказы: [OrdersRoute](src/modules/orders/OrdersRoute.vue),
  [OrdersPage](src/modules/orders/OrdersPage.vue),
  [store](src/modules/orders/orders.store.ts) и [API](src/modules/orders/orders.api.ts).
- Меню: [CatalogPage](src/modules/catalog/CatalogPage.vue),
  [CatalogCategoryDialog](src/modules/catalog/components/CatalogCategoryDialog.vue)
  и соседний [CatalogOptionGroupSelect](src/modules/catalog/components/CatalogOptionGroupSelect.vue).
- Смена сеанса: ключ в [App](src/app/App.vue),
  [useApplicationDomains](src/app/useApplicationDomains.ts) и
  [session store](src/modules/session/session.store.ts).

## Локальный запуск

Нужны Node.js `>=22.12.0` и работающий backend на `http://127.0.0.1:3000`.
Его окружение, одноразовая БД и запуск описаны в [README backend](../backend/README.md).
`CORS_ORIGINS` backend должен разрешать `http://localhost:5174`: proxy сохраняет
исходный Origin. Отдельный `.env` клиента для стандартного запуска не требуется.

Из каталога `back-office`:

```bash
npm ci --ignore-scripts
npm run dev
```

Откройте `http://localhost:5174/`. Порт фиксирован; занятый `5174` завершает
запуск ошибкой. `/api` проксируется на backend без переписывания пути.
Без backend восстановление сеанса покажет ошибку, а запрос кода не подтвердит
отправку. Локальный OTP задаётся окружением backend; клиент не содержит
фиксированного кода или имитации ответа.

## Нетестовые проверки

Команды из `package.json`, рабочий каталог — `back-office`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Сборка создаёт `dist/`; она не подтверждает визуальное соответствие или
готовность рабочих разделов. Автоматизированные тесты запрещены по
[AGENTS](../AGENTS.md). Визуальные изменения требуют финального просмотра
и независимой проверки по [стратегии проверки](../docs/40-quality/Validation-strategy.md).

## Документация и границы

- [Карта клиента](docs/INDEX.md) — текущие владельцы и размещение кода.
- [Нативная установка](docs/10-architecture/pwa-installation.md) — установка средствами браузера и наблюдаемые ограничения.
- [Контракт сотрудника](../docs/50-interfaces/Back-office-UI.md) — требуемые результаты всех разделов.
- [Технический DoD](../docs/80-conventions/Code-Definition-of-Done-back-office.md) — обязательные критерии кода.
- [Правила выпуска](../docs/70-deployment/Release-and-version-compatibility.md) — поддерживаемая development-поставка.

До текущего рефакторинга локальный production-runtime обслуживал настоящий собранный клиент.
Нативные подписки Customer и Barista получены через обычный интерфейс;
наблюдались реальные association/inspect/disable и доставка уведомлений до
browser notification registry после настоящего заказа. Подготовка разрешения
через browser context не является наблюдением видимого native prompt.
Подробные подтверждения и оставшиеся критерии описаны в
[HTTP и уведомлениях](docs/10-architecture/staff-read-slice.md#наблюдения-и-пределы).

Предыдущие ограничения G2 о приостановленных рабочих разделах и auth503
не являются границей новой G3 реализации. Независимые результаты ограниченной
доступности и установки сохраняют историческую область; они не подтверждают
полный текущий клиент. Обязательные native click, установка с повторным запуском
полного клиента, независимое review и проверка deployed origin остаются
отдельными результатами. Независимое review ограниченных частей рефакторинга
не заменяет приёмку итоговой интеграции и пользовательских сценариев.

## Контейнер

Из корня репозитория:

```bash
docker build -t expressa-back-office:local back-office
```

Сборка принимает `VITE_API_BASE_URL` (по умолчанию `/`); значение
используется HTTP-транспортом клиента. Отдельного переключателя окружения
`VITE_APP_ENV` у back-office нет.

Образ слушает непривилегированный порт `8080`, проверяет `/health`,
обслуживает SPA и проксирует `/api` к сервису `backend:3000` без переписывания
пути. Для совместной development-поставки используйте существующий deployment
workflow; отдельный локальный контейнер должен находиться в сети с этим backend.
HTTP-политика и готовность образа не заменяют проверку пользовательского потока.
