# Expressa back-office

Рабочее PWA Expressa для бариста и администратора. Сотрудник входит по
одноразовому коду, ведёт очередь заказов, меняет доступность позиций и управляет
каталогом.

## Структура каталога

```text
back-office/
├── contracts/        # локальный снимок HTTP-контракта OpenAPI
├── docs/             # документация сценариев, устройства и проверок
├── public/           # статические файлы PWA
├── scripts/          # локальные служебные проверки
├── src/              # Vue runtime приложения
├── .env.example      # пример переменных окружения без секретов
├── package.json      # команды разработки и зависимости
├── vite.config.ts    # настройка Vite и PWA
└── README.md         # вход в контур
```

Используйте Node.js `24.15.0` из [.nvmrc](.nvmrc).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

## Каталог интерфейса

Storybook показывает изолированные компоненты, диалоги, screen-композиции и состояния back-office
на статических fixture-данных. API, авторизация и пользовательские сценарии для
него не нужны; route pages и пользовательские journey намеренно не переносятся.

Навигация русифицирована и идёт от простого к составному: «Базовые элементы»
(токены и отдельные контролы), «Компоненты» (формы, диалоги, навигация и обратная
связь), «Бизнес компоненты» (вход, заказы, доступность и меню), «Экраны»
(композиции активных экранов в оболочке). Состояния собраны внутри своего
компонента; неиспользуемый UI и дубли экранных историй исключены.

```sh
npm run storybook
npm run storybook:build
```

`.env.local` задаёт обязательные `VITE_APP_ENV=local` и
`VITE_API_BASE_URL=/`. Vite проксирует same-origin `/api/v2` и `/api/v3` на
`http://localhost:3000`; для другого backend origin задайте
`VITE_API_PROXY_TARGET` при запуске Vite.

## Работа с контуром

- [Правила области](AGENTS.md) фиксируют автономность back-office и приёмку
  изменений.
- [Карта документации](docs/INDEX.md) ведёт к рабочим сценариям, API-границе и
  устройству UI.
- [Маршруты](src/app/router.ts) — вход в runtime, который следует слоям
  `app -> pages -> widgets -> features -> entities -> shared`.
- [OpenAPI-снимок](contracts/openapi.json) сверяется с backend командой
  `npm run contract:check`.

## Проверки

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run contract:check
npm run storybook:build
```

Отдельный browser/E2E-набор не ведётся. Пользовательские потоки принимают
вручную в работающем приложении.

Автоматизированные тесты разрешены только по условиям [корневого AGENTS.md](../AGENTS.md). Перечень команд не разрешает их запуск.
