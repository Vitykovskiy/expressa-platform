# Expressa back-office

Рабочее Vue-приложение сотрудников Expressa. В текущем runtime доступны вход по одноразовому коду и управление каталогом для администратора; очередь и доступность — защищённые экраны-заглушки.

Требуется Node.js `24.15.0`.

```sh
npm ci
npm run dev
```

Основные проверки: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`, `npm run contract:check`. Полный набор Storybook и E2E — в [документации](docs/INDEX.md).
