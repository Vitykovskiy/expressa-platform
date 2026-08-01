# Expressa front-office

Автономный клиент Expressa на Vue 3, Vuetify, Pinia и Vite.

Используйте Node.js `24.15.0` из `.nvmrc`.

```bash
npm ci
npm run dev
```

Проверки:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run storybook:build
npm run test:a11y
npm run test:visual
npm run test:e2e
npm run build
npm run contract:check
```

`npm run test:visual` запускает снимки Storybook в закреплённом Linux-образе
Playwright. Для этого на машине нужен Docker.

Текущая база знаний: [docs/INDEX.md](docs/INDEX.md).
