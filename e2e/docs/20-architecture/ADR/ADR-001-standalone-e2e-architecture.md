---
title: ADR-001 — Архитектура standalone E2E
description: UI-only архитектура Playwright-набора Expressa.
type: adr
area: e2e
status: accepted
sources:
  - ../../../playwright.config.ts
  - ../../../fixtures/test.ts
related:
  - ../../10-overview/Quick-start.md
  - ../../80-conventions/Code-style.md
---

# ADR-001 — Архитектура standalone E2E

## Статус

Решение принято.

## Контекст

Standalone E2E связывает пользовательские действия в front-office и back-office, не смешивая runtime-код клиентов с общим набором. Оба интерфейса поставляются и запускаются вне `e2e`.

## Решение

- Набор использует Playwright Test с одним проектом Chromium, одним worker, без retries, HTML-отчётом и screenshot только при ошибке.
- `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL` обязательны и проходят проверку в `support/config` до исполнения сценария.
- Domain Page — тонкий корень композиции экрана: он открывает страницу и предоставляет её устойчивые области как Component Objects. Component Object владеет локаторами, ожиданиями готовности и атомарными UI-действиями; `fixtures/test.ts` собирает зависимости сценария. Только `fixtures/multi-session.fixture.ts` создаёт дополнительный Playwright context и Page, закрывает их в lifecycle fixture и не содержит предметного workflow.
- Предметные данные находятся в `support/data`. Взаимодействие с приложениями выполняется только через UI Playwright: API, БД, Web Storage, прямое изменение сети и запуск приложений не используются.
- Локаторы остаются приватной деталью объектов. Роли, доступные имена, подписи и стабильные идентификаторы образуют основной контракт; `data-testid` добавляется только для структурного элемента, который нельзя выразить этим контрактом.
- Локальный Component Object принадлежит одной Domain Page и лежит в её каталоге. `components/<office>/<area>` содержит только shared Component Objects, используемые минимум двумя Domain Page; для текущего набора это `phone-verification` и `guest-checkout-form`.
- Каждый Page и Component имеет собственный каталог. Локальные файлы имеют вид `pages/<office>/<area>/<page-name>/<page-name>.page.ts` и `pages/<office>/<area>/<page-name>/<local-component-name>/<local-component-name>.component.ts`; shared Component — `components/<office>/<area>/<component-name>/<component-name>.component.ts`.
- `*.constants.ts` и `*.types.ts` принадлежат ровно одному Page или Component, лежат в его каталоге и имеют его базовое имя. Любой именованный module-scope `const`, задающий статический UI-контракт или конфигурацию владельца, выносится в `<owner>.constants.ts`, а любой именованный module-scope `type` или `interface` владельца — в `<owner>.types.ts`, независимо от `export` и повторного использования; локальные переменные, параметры и private Locator-поля остаются в классе.
- `e2e/tsconfig.json` задаёт алиасы `@pages/*`, `@components/*`, `@fixtures/*` и `@support/*`. Межкаталожные импорты используют алиасы; относительный импорт допустим только между файлами одного владельца.

## Последствия

Набор дополняет, но не изменяет локальные E2E клиентов. Сквозные сценарии фиксируются в [карте сценариев](../../95-testing/E2E-map.md) и выполняются только против подготовленной внешней среды. Текущая структура приводится к принятому решению отдельной реализацией.
