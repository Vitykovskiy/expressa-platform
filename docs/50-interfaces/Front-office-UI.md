---
title: "Интерфейс front-office"
type: interface
owner: root
implementation_status: current
last_verified: 2026-10-08
sources:
  - ../../front-office/src/app/router.ts
  - ../../front-office/src/entities/customer/model/menu.store.ts
  - ../../front-office/src/features/checkout/checkout.store.ts
  - ../../front-office/src/pages/CartPage.vue
knowledge_role: requirements
scope: system
---

# Интерфейс front-office

## Реализация по исходникам

[Маршрутизатор](../../front-office/src/app/router.ts) регистрирует меню, корзину, OTP, историю и детали заказа. История и детали защищены customer guard. Безопасный внутренний `returnTo` определяет `getSafeAuthReturnTo` в [auth-return.ts](../../front-office/src/shared/lib/auth-return.ts).

| Область                            | Основной источник                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Маршруты и потребляемый API        | [Контур front-office](../../front-office/docs/00-meta/Scope.md)                                                                                             |
| Меню и конфигурация                | [Локальная feature-нота](../../front-office/docs/30-features/Menu-and-configuration.md)                                                                     |
| Корзина, checkout и ошибки         | [Локальная feature-нота](../../front-office/docs/30-features/Cart-and-checkout.md), [межконтурный сценарий](../40-features/Authenticate-and-place-order.md) |
| История, детали и локальный повтор | [Локальная feature-нота](../../front-office/docs/30-features/Orders.md)                                                                                     |
| Переиспользуемый UI и владельцы    | [UI-контракты](../../front-office/docs/30-conventions/UI-contracts.md)                                                                                      |

Это описание исходников. Работающий UI в этой документационной правке не наблюдался; визуальная приёмка и выполнение требований ниже не утверждаются.

## Требования к навигации customer

Ниже 1024px header всегда содержит один left-aligned touch-control с видимой
надписью «Экспресса» (и декоративной чашкой там, где она помещается), без
House. Его доступное имя — «Перейти в меню»: с корня
меню действие безопасно повторяет reset, с категории или товара возвращает в
корень MenuFlow, а с остальных маршрутов открывает `/`. Отдельного Home-action
нет. Back не принадлежит header: на category, product и details он находится
в отдельной left-aligned contextual row сразу под header и перед primary content
соответствующего экрана; он не входит в строку заголовка. Бренд всегда
начинается от левого content edge header. Справа в
постоянных позициях находятся «Аккаунт», «История заказов» и «Корзина».
Гость и вошедший customer видят те же действия в тех же местах: отличаются
только защищённый результат History и содержимое Account-диалога.

От 1024px сохраняется существующая боковая навигация: clickable brand, Menu,
History, Cart, categories и нижняя строка Account. Account остаётся постоянным
местом управления уведомлениями. Явный logout отвязывает только текущую
browser association и не меняет browser permission или local subscription. Точный
сценарий уведомлений — в [системной feature-ноте](../40-features/Track-history-and-repeat-order.md),
а контракт shell — в [UI-контрактах front-office](../../front-office/docs/30-conventions/UI-contracts.md).

## Требования к Account и пустой History

Гость открывает компактный Account ровно с заголовком «Аккаунт», текстом «Вы
не вошли в аккаунт» и действием «Войти»; дополнительного объяснения и
notification inspection нет.
Вошедший customer видит телефон, один статус «Уведомления о заказах», только
применимое действие и визуально отделённый logout. Endpoint, owner,
association/version и предупреждения о технической привязке не показываются.

Диалог имеет один источник open-состояния, видимую 44px кнопку закрытия и
возвращает фокус фактическому desktop/mobile trigger после X, Escape и
backdrop. Повторное и быстрое открытие не создаёт второй диалог; reduced motion
не использует выезд из trigger. На 479/480 и 1023/1024 px нет overflow или
скачка layout.

Пустая History повторяет уже применённый паттерн пустой Cart: центрированный
блок в доступной content area, круглая subtle-surface иконка, текст «История
заказов пуста» и крупная surface-кнопка «Перейти в меню». Refresh остаётся
вторичным действием header.

Повторно используемая кнопка связывает disabled/loading с `aria-busy` и
показывает progressbar во время loading. [front-office/src/shared/ui/customer/btn/UiBtn.vue:entry](../../front-office/src/shared/ui/customer/btn/UiBtn.vue).
