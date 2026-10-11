# Back-office 2.0

Новый автономный клиент Expressa для бариста и администратора. Основание и Storybook дополнены входом сотрудника и чтением очереди/деталей и lifecycle-командами заказа через текущий API, оперативной доступностью и administrator-категориями/товарами с атомарными ценами. Полный staff-workflow ещё не завершён.
Пользователь разрешил продолжение; независимая приёмка основания и интегрированного UI остаётся открытой. В текущей изолированной local-среде частично наблюдены штатный вход администратора/бариста, отказ customer, очередь/снимки настоящих заказов, поиск и восстановление. Четыре lifecycle-команды наблюдены для обеих staff-ролей через текущий API, с непустой серверной историей и сохранёнными снимками. Offline-команда и восстановление original order наблюдены; полные concurrency и визуальные критерии ещё не подтверждены; [точный объём наблюдений](docs/10-architecture/staff-read-slice.md#граница) не является приёмкой.

## Структура каталога

```text
back-office/
├── src/
│   ├── app/                 # bootstrap, тема, оболочка, URL
│   ├── pages/               # вход, очередь, доступность, каталог
│   ├── widgets/             # readonly представление сценариев
│   ├── features/            # OTP, поиск и явные действия
│   ├── entities/            # session/order/availability/catalog owners
│   └── shared/              # transport, tokens, базовый UI
├── .storybook/              # каталог тех же компонентов
├── public/                  # manifest и оригинальные staff-иконки
├── docs/                    # контракты и карта покрытия
├── package.json
├── package-lock.json
└── README.md
```

## Начало работы

До реализации прочитайте [code-style DoD](docs/80-conventions/code-style-dod.md),
[UI ownership](docs/10-architecture/ui-ownership.md) и
[размещение кода](docs/80-conventions/code-layout.md). Из этого каталога выполните `npm ci`, затем `npm run dev` или `npm run storybook`.
Приложение открывайте по `http://localhost:5174/`, Storybook — по адресу его сервера.
Vite проксирует `/api` на `http://localhost:3001` с исходным browser Origin; backend должен разрешать `http://localhost:5174`. Не заменяйте hostname на `127.0.0.1`: это другой Origin и область cookie. Backend запускается по своему README; нужны действующая схема/seed, OTP provider и staff-роль. Настройки и guards backend здесь не меняются.
Приложение восстанавливает сеанс через cookie и показывает вход при отсутствии сеанса. Подробнее: [чтение заказов](docs/10-architecture/staff-read-slice.md).

Нетестовые проверки: `npm run format:check`, `npm run lint`,
`npm run typecheck`, `npm run build`, `npm run build-storybook`.
`npm run format` форматирует только контур с корневым Prettier-конфигом.
Статическая сборка приложения находится в `dist/`, каталога — в `storybook-static/`.
Сборки не являются приёмкой UI. Автоматизированные тесты запрещены.

Основание включает светлую и тёмную темы, базовые UI-компоненты
и интерактивный Storybook. Это каталог для ручного осмотра, не доказательство
реализованного заказа или управления каталогом. Продолжение разрешено пользователем; это не закрывает независимые визуальные и runtime-проверки.

## Контейнер и development-поставка

[Dockerfile](Dockerfile) собирает приложение через `npm ci` и `npm run build`
из этого каталога. `VITE_APP_ENV` и `VITE_API_BASE_URL` передаются как build args;
штатная development-поставка задаёт `development` и `/`. Приватные `.env`,
зависимости, локальные сборки, Storybook и документация исключены из контекста.
Версии базовых Node 24 и unprivileged nginx закреплены digest в Dockerfile.

Runtime содержит собранный `dist/` и [локальную конфигурацию nginx](nginx.conf).
Он слушает порт `8080`; `/health` возвращает `200` и `ok`. SPA-маршруты
возвращают `index.html`. `/api/v2` и `/api/v3` передаются сервису `backend:3000`
с исходным путём и query, с `Cache-Control: no-store`. Root
`/staff-push-worker.js` публикуется без хранения в cache; manifest, worker,
файлы `assets/` и `icons/` при отсутствии возвращают `404` без SPA-подстановки.
Публикация worker не подтверждает permission, доставку push или browser-native
установку.

Поддерживается только совместная [development-поставка](../docs/70-deployment/CI-CD.md)
из `main`: backend, front-office и back-office. Она пересоздаёт development-базу
и заполняет seed; данные между поставками не сохраняются. Доступ, секреты и
предварительные условия VPS задаёт [карта сред](../docs/70-deployment/Environments.md).
Контейнерная сборка и health не заменяют незавершённую независимую приёмку
staff-сценариев и UI. Staging и production не поддерживаются.

## Контракты

[Каталог и категории](docs/10-architecture/catalog-categories-slice.md) описывает
administrator GET и create/full-edit/archive/full-reorder, readonly recovery,
защищённый cache и sibling freshness. [Товары и атомарные цены](docs/10-architecture/catalog-products-slice.md) имеют
одного владельца draft/command с категориями и
[группами добавок](docs/10-architecture/catalog-modifiers-slice.md). Group aggregate
и отдельный option reorder реализованы в том же owner.
[Связи категории с группами](docs/10-architecture/catalog-associations-slice.md)
имеют отдельную задачу полного состава/порядка, targeted confirmation и strict PUT.
Исходные требования задают связи групп с категориями; отдельный редактор прямых
связей товаров ими не задан. Прямые связи существуют в
[схеме](../backend/schema.sql), но административная v3-проекция и текущие команды
из [обзора API](../docs/50-interfaces/Back-office-API.md) не дают отдельного
read/write-сценария их редактирования; техническая граница остаётся открытой.
[Установка рабочего приложения](docs/10-architecture/pwa-installation.md)
имеет manifest и новые иконки; реальная browser-native установка и запуск ещё
не подтверждены. Staff push, явное включение уведомлений и открытие соответствующего
заказа реализованы в текущих исходниках; browser-native/API поведение не наблюдено
и не принято. Владельцы и ограничения описаны в
[staff slice](docs/10-architecture/staff-read-slice.md#уведомления-и-logout).
Полная матрица наблюдений и независимая приёмка открыты.
Это исходники реализации, не независимая приёмка.

Новые исходники доступности и межраздельной навигации описаны в
[availability slice](docs/10-architecture/availability-slice.md). Их проверка
типов использует разрешённый PATCH в общем типе запроса без изменения
runtime транспорта. Основные scalar-команды и GET-восстановление наблюдены
локально; полная runtime-матрица и независимая приёмка ещё не завершены.
Прежние наблюдения order/session относятся к прежнему снимку исходников.

- [Продуктовый UI-контракт](../docs/50-interfaces/Back-office-UI.md) задаёт
  staff-результаты, роли и бизнес-инварианты.
- [Обзор API](../docs/50-interfaces/Back-office-API.md) маршрутизирует операции;
  точные HTTP-схемы принадлежат [OpenAPI](../backend/openapi/openapi.json).
- [ADR-011](../docs/20-architecture/ADR/ADR-011-back-office-clean-slate.md)
  сохраняет технические и бизнес-границы, освобождая новую визуальную форму.

## Документация

[Карта](docs/INDEX.md) ведёт к локальным владельцам. [llms.txt](llms.txt)
содержит компактный маршрут для AI. Документация обновляется с изменением
своего контракта по [протоколу обновления](../docs/00-meta/Update-protocol.md).
