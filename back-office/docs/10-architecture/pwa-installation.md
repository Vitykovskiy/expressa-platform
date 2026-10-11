---
title: "Установка рабочего приложения"
type: architecture
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../index.html
  - ../../public/manifest.webmanifest
  - ../../public/icons/expressa-staff.svg
  - ../../public/icons/expressa-staff-192.png
  - ../../public/icons/expressa-staff-512.png
  - ../../vite.config.constants.ts
  - ../../src/main.ts
  - ../../src/app/navigation.ts
  - ../../src/app/theme.ts
  - ../../src/shared/config/theme.constants.ts
  - ../../../docs/10-overview/MVP-scope.md
  - ../../../docs/_sources/Expressa_MVP_Техническое_задание.md
  - ../../../docs/20-architecture/ADR/ADR-011-back-office-clean-slate.md
---

# Установка рабочего приложения

Опубликованы manifest и новые иконки сотруднического приложения. Это реализация
метаданных для установки через средства браузера; фактическая установка,
появление имени и иконки в ОС и запуск отдельного окна ещё не подтверждены.
Независимая приёмка остаётся открытой.

Установка входит в исходный продуктовый результат: рабочее PWA в
[MVP](../../../docs/10-overview/MVP-scope.md#состав-mvp), TR-REP-003 и
FR-PUSH-001 исходного ТЗ. [ADR-011](../../../docs/20-architecture/ADR/ADR-011-back-office-clean-slate.md#сохраняемые-границы)
сохраняет этот результат при проектировании нового UI. Основные функции требуют
сети по разделу 17 исходного ТЗ.

## Владельцы публикации

[`index.html`](../../index.html) подключает
[`manifest.webmanifest`](../../public/manifest.webmanifest) и SVG favicon.
Обычный каталог `public/` обслуживается текущим Vite без дополнительного plugin;
его файлы копируются в `dist/` с исходными именами по
[контракту Vite](https://vite.dev/guide/assets.html#the-public-directory).
Manifest публикуется без отдельного plugin; текущий push-only worker собирается
отдельным Vite worker entry, описанным ниже.

Manifest задаёт `Expressa — сотрудники`, короткое имя `Expressa Staff`, язык
`ru` и `display: standalone`. `id: expressa-staff` — постоянный идентификатор
установленного приложения на данном origin, не HTTP-маршрут. По
[правилу id](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id)
относительное значение разрешается от origin стартового URL.
`start_url: ./` и `scope: ./` разрешаются относительно root manifest и задают
чистый вход текущего приложения. Параметры раздела, заказа, поиска и личности
не становятся адресом запуска.

Текущий [Vite config](../../vite.config.constants.ts) не задаёт `base`;
локальный вход — `http://localhost:5174/`. Это не подтверждение пути внешней
поставки. Смена origin, префикса размещения или совместное размещение клиентов
на одном origin требует повторной оценки identity/scope и HTML-ссылок.
Нельзя незаметно менять `id` ради версии или переносить сюда адрес клиентского
приложения.

## Иконка и тема

Новая [SVG-иконка](../../public/icons/expressa-staff.svg) содержит геометрическую
белую E с отступом на непрозрачном синем квадрате. Реальные PNG
[192×192](../../public/icons/expressa-staff-192.png) и
[512×512](../../public/icons/expressa-staff-512.png) экспортированы из этого
рисунка, оба объявлены с `purpose: any`; маскируемая иконка не заявлена.

Цвета публикации взяты из текущих light значений
[`theme.constants.ts`](../../src/shared/config/theme.constants.ts):
primary `#2156D9`, on-primary `#FFFFFF`, background `#F5F6F8`.
Это статическая иконка и стартовые значения manifest, не отдельная палитра UI.
Единственный [владелец предпочтения темы](../../src/app/theme.ts) сохраняет
system/light/dark поведение приложения. Manifest не обещает изменение ОС-иконки
или browser chrome вслед за сохранённой темой; HTML `theme-color` и второй
владелец темы не добавлены.

## Запуск и границы

Установка использует браузерные средства; собственных кнопок, banners,
обучения и обработчиков install-событий нет. Поддержка и способ установки
зависят от браузера и ОС; опубликованные
[критерии MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
не являются доказательством установки этой версии.

Чистый вход следует текущим `main.ts` и
[`navigation.ts`](../../src/app/navigation.ts): при отсутствии `section`
выбраны «Заказы», перед защищённым содержимым действует обычное восстановление
сеанса. Установка не предоставляет роль сотрудника. Новое окно запускает
обычный экземпляр приложения с независимым состоянием в памяти; перенос
несохранённых draft, неизвестной команды и синхронизация окон не обещаны.
Этот пакет не добавляет reload, отправку команды или изменение состояния
сохранившегося исходного окна.

Push-only service worker реализован через root
[`staff-push-worker.ts`](../../staff-push-worker.ts) и
[`app worker`](../../src/app/staff-push.worker.ts). App получает native script
через `?worker&url`; existing Vite `worker.format: es` и
`worker.rolldownOptions.output.entryFileNames` дают root `staff-push-worker.js`.
Нет raw TS public asset, broad Service-Worker-Allowed, fetch handler,
skipWaiting/clients.claim, reload или update prompt. Registration происходит
только при явной подготовке enable; открытие/read/login её не создают.
Ожидаемые origin/BASE_URL/scope/script проверяются; чужая регистрация не заменяется.
Activation, dev MIME/module loading и scope фактически не наблюдены.

Offline cache, защищённое хранилище, очередь записей и повтор мутаций отсутствуют. Холодный запуск
может зависеть от сети. Исходные правила ошибки, неопределённого результата,
роли, logout и lifetime остаются у текущих владельцев сценариев.

## Требования уведомлений и доказательства

FR-PUSH-002/004/005/006 требуют пояснения назначения и разрешения после явного
«Включить уведомления», уведомления бариста о новом заказе, открытия
соответствующего заказа и работы при отказе или недоступности push.
Это реализованный в текущих исходниках, но ненаблюдённый и непринятый сценарий: по текущему
[push-контракту](../../../docs/50-interfaces/Push-notifications.md) серверная
ассоциация подписки и реальная доставка отличаются от browser permission.
Установка их не подтверждает. Текущий source-supported backend D13 разрешает
CustomerOrBarista association, запрещает каждый foreign transfer для Barista
и выбирает Barista-получателей; этот backend ещё не принят по live-критериям.
Прежний source API/role-конфликт этим изменением заменён, а не доказан обходом
Customer UI или permission-only успехом. Frontend lifecycle, logout capability,
latest-click protocol и пределы источников описаны в
[staff slice](staff-read-slice.md#уведомления-и-logout).

Источник, экспорт и нетестовая сборка не заменяют личный и независимый осмотр.
Открыты реальные accept/dismiss, имя/иконка в ОС, standalone/normal entry,
default Orders/auth/roles/theme, сеть и сохранность исходного окна с unsent/
unknown context. Все прежние обе темы, ширины, состояния, API/adverse/lifetime,
клавиатура/focus/scroll/assistive/zoom/contrast остаются обязательными по
[UI ownership](ui-ownership.md) и
[стратегии проверки](../../../docs/40-quality/Validation-strategy.md).
Наличие manifest не означает приёмку всего PWA или back-office.
