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
├── tests/            # Playwright-сценарии в браузере
├── .env.example      # пример переменных окружения без секретов
├── package.json      # команды разработки и зависимости
├── vite.config.ts    # настройка Vite и PWA
└── README.md         # вход в контур
```

Используйте Node.js `24.15.0` из [.nvmrc](.nvmrc).

```sh
npm ci
npm run dev
```

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
npm test -- --run
npm run build
npm run contract:check
```

Браузерные проверки и условия их запуска — в
[документации проверок](docs/95-testing/README.md).
