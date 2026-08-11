---
title: Push-уведомления
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/app.module.ts
  - ../../front-office/src/app/pwa.ts
---

# Push-уведомления

Текущая backend composition регистрирует auth, catalog, orders, database,
health и observability modules; push module в этой границе отсутствует.
[backend/src/app.module.ts:AppModule](../../backend/src/app.module.ts).

Front-office в production регистрирует PWA service worker через `registerSW`;
регистрации permission, subscription или push handler в этой точке нет.
[front-office/src/app/pwa.ts:registerPwa](../../front-office/src/app/pwa.ts).

Push-уведомления поэтому не являются действующим межконтурным контрактом.
[backend/src/app.module.ts:AppModule](../../backend/src/app.module.ts), [front-office/src/app/pwa.ts:registerPwa](../../front-office/src/app/pwa.ts).
