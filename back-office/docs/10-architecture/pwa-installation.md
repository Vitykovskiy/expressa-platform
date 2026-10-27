---
title: "Нативная установка back-office"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-25
sources:
  - ../../index.html
  - ../../public/manifest.webmanifest
  - ../../public/pwa/icon-192.png
  - ../../public/pwa/icon-512.png
  - ../../src/app/App.vue
  - ../../src/app/router.ts
  - ../../src/app/bootstrap.ts
  - ../../src/modules/notifications/native-push.ts
  - ../../src/modules/notifications/native-intent.ts
  - ../../public/service-worker.js
  - ../../nginx.conf
  - ../../../docs/50-interfaces/Back-office-UI.md
---

# Нативная установка back-office

## Реализация

[HTML-вход](../../index.html) подключает локальный
[manifest](../../public/manifest.webmanifest). Браузер устанавливает
`Expressa Admin` своими средствами; отдельного экрана или кнопки установки
в приложении нет. Исходная предварительная загрузка иконки ошибки сохранена.

`start_url` и `scope` равны `/` на текущем origin; `display` — `standalone`.
Новый запуск использует обычный вход приложения. Vue Router ожидает initial
readiness до mount persistent App. Manifest сохраняет start_url `/`,
который redirect на /orders; установка не предоставляет роль. Сеанс
восстанавливает существующий владелец через сервер, а не manifest.

Иконки PNG 192×192 и 512×512 используют исходный wordmark `Expressa`
из [Figma, узел 36:163](https://www.figma.com/design/ZAOqxmGZksdKhQwEjaOrHG/Expressa-Admin-Design-System?node-id=36-163).
Нативный экспорт помещён на квадратный белый фон без перерисовки надписи.
`purpose: any` не обещает безопасную обрезку как у maskable-иконки.

## Наблюдаемые границы

21 октября 2026 года на macOS в Google Chrome 155.0.8059.85 выполнена
нативная установка с `http://localhost:5174/`. Браузер показал имя и исходную
иконку; отдельное установленное приложение открыло реальную форму входа.
После полного закрытия и повторного запуска оно снова открыло этот origin
и форму входа. Затем выполнен реальный вход существующего бариста и повторный
запуск без logout: приложение восстановило staff-сеанс и показало исходное
сообщение недоступного раздела `orders`. Это подтверждает сохранение
серверного сеанса при данном запуске, но не готовность заказов.

Независимая проверка подтвердила исходные иконки, реальные HTTP-ответы manifest
и PNG, а также запуск уже установленного приложения после полного завершения
его процесса. Повторный запуск восстановил staff-сеанс на том же origin
с указанным сообщением раздела `orders`. Результат относится к нативной
установке и повторному запуску в данной среде; другие браузеры не проверены.

Manifest отдаётся как `application/manifest+json`, обе иконки — как
`image/png`; ответы содержат реальные файлы, не HTML fallback. Локальная
установка требует работающего клиента; основные функции требуют backend
и сети. Текущая реализация содержит push-only service worker; offline cache и
очереди записей нет. HTTP и native lifecycle описаны в
[интеграционной ноте](staff-read-slice.md#уведомления-и-logout).

Требования полного продукта принадлежат [контракту сотрудника](../../../docs/50-interfaces/Back-office-UI.md#установка-и-уведомления).
Историческое наблюдение установки выше относилось к прежнему ограниченному
клиенту. Текущий полный клиент монтирует заказы и остальные рабочие разделы;
их нативный повторный запуск после последней интеграции требует новой независимой
проверки. Подготовка browser permission не заменяет видимый prompt, установку,
системный клик или проверку development-origin. Auth503 по G3/U007 не является
открытым критерием завершения.

## Текущий вход и снятые переходы

По [ADR-016](../../../docs/20-architecture/ADR/ADR-016-back-office-vue-router.md)
[Nginx](../../nginx.conf) передаёт application paths в index.html. Пять named
путей работают при прямом входе; `/` и неизвестные пути (также /queue и /menu)
redirect на orders средствами Vue Router. Старого pathname translator нет.
Missing static, включая /sw.js, сохраняет404; API/health не получают SPA HTML.
Worker распознаёт same-origin `/` и пять application paths с optional slash;
холодный fallback — /orders?order=UUID. Proof/controller/lifetime не меняются.

Текущие `/service-worker.js`, manifest, иконки, шрифт и assets сохранены.
Явная [подготовка уведомлений](../../src/modules/notifications/native-push.ts)
регистрирует текущий worker с областью `/`; она не запрашивает permission
и не создаёт подписку. Разрешение и подписка остаются отдельным явным
действием по [текущему lifecycle](staff-read-slice.md#уведомления-и-logout).
[Проверка native intent](../../src/modules/notifications/native-intent.ts)
принимает только активный текущий controller своей регистрации и origin.

Удаление исходников не удаляет прежние browser-managed регистрации:
они могут сохраниться и не заменяются принудительно при запуске приложения.
Кеши, подписки, разрешения и данные авторизации не очищаются. Автоматическое
обновление прежней установки больше не обещается; поведение конкретной
старой установки не подтверждено удалением кода или сборкой. Датированные
наблюдения выше сохраняют свою историческую область.
