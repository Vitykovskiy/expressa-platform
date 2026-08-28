# Expressa front-office

Клиентское PWA покупателя: меню, вход по телефону, корзина и оформление
заказа. Статус оформленного заказа доступен в приложении.

Для работы требуется Node.js `24.15.0` из [.nvmrc](.nvmrc).

## Структура каталога

```text
front-office/
├── contracts/        # снимок HTTP-контракта, используемый клиентом
├── docs/             # описание сценариев, устройства и проверок
├── public/           # статические ресурсы PWA
├── scripts/          # локальные проверки контракта
├── src/              # исходный код Vue-приложения
├── tests/            # сквозные браузерные сценарии клиента
├── .nvmrc            # требуемая версия Node.js
├── AGENTS.md         # правила работы в контуре
├── package.json      # команды и зависимости приложения
└── README.md         # вход в контур
```

## Запуск

```bash
npm ci
npm run dev
```

## Устройство и проверка

Runtime находится в `src` и разделён по ролям:

- `app` собирает приложение;
- `pages` владеют страницами;
- `widgets` отвечают за их состав;
- `features` содержат действия пользователя;
- `entities` содержат предметные данные;
- `shared` содержит общие примитивы клиента.

Unit-тесты располагаются рядом с runtime-кодом, браузерные сценарии — в
`tests/e2e`.

Команды проверки:

- `npm run typecheck`;
- `npm run lint`;
- `npm run format:check`;
- `npm test`;
- `npm run test:e2e`;
- `npm run contract:check`.

Полный список и параметры — в [package.json](package.json).

[Документация](docs/INDEX.md) описывает сценарии и контракты.

[AGENTS.md](AGENTS.md) содержит правила работы.

- Точку сборки приложения задаёт [src/app/App.vue](src/app/App.vue).
- Маршруты задаёт [src/app/router.ts](src/app/router.ts).
- HTTP-границу задаёт [contracts/openapi.json](contracts/openapi.json).
