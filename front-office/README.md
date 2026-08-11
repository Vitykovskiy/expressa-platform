# Expressa front-office

Клиентское приложение кофейни: меню, авторизация по телефону, корзина и заказ.
Используйте Node.js `24.15.0` из `.nvmrc`.

```bash
npm ci
npm run dev
```

Runtime-код лежит в `src`: `app` собирает приложение и сессию, `pages` владеют
маршрутами, `widgets` — оболочкой, `features` — действиями пользователя,
`entities` — корзиной и меню, `shared` — HTTP-клиентом и UI-примитивами.
[Исходник: слои и маршруты](src/app/router.ts).

Storybook запускается `npm run storybook`; он зависит от runtime, а runtime не
импортирует истории. Истории, fixtures и проверки лежат в `.storybook`.
[Источник: конфигурация Storybook](.storybook/main.ts).

Команды проверки — в [package.json](package.json). Сценарии, UI и API описаны в
[docs/INDEX.md](docs/INDEX.md). Локальные правила: [AGENTS.md](AGENTS.md).
