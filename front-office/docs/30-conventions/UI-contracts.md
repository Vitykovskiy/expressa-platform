---
type: ui-contract
owner: front-office
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/widgets/customer-shell/CustomerShell.vue
  - ../../src/shared/ui/customer/phone-input/UiPhoneInput.vue
---

# Контракты повторно используемого UI

Нота покрывает оболочку, примитивы и общие правила; поведение экранов находится
в feature-нотах. [Источник: shell](../../src/widgets/customer-shell/CustomerShell.vue).

| Контракт                | Поведение, данные и состояния                                                                                                                                                                                                                                                                             | Источник и проверка                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/navigation        | отображает маршрутную область и навигацию; активный пункт и ссылка доступны клавиатуре                                                                                                                                                                                                                    | [shell](../../src/widgets/customer-shell/CustomerShell.vue), [navigation](../../src/widgets/customer-shell/ShellNavigation.vue)                                                                                              |
| Button/icon button      | `disabled`/`loading` блокируют действие; icon button требует доступного имени                                                                                                                                                                                                                             | [UiBtn](../../src/shared/ui/customer/btn/UiBtn.vue), [UiIconBtn](../../src/shared/ui/customer/icon-btn/UiIconBtn.vue)                                                                                                        |
| Phone/OTP поля          | оба принимают `modelValue`, `label`, `loading`, `disabled`, `readonly` и испускают только `update:modelValue`; loading отключает поле, phone задаёт tel/inputmode/auto-complete, OTP оставляет цифры и максимум шесть                                                                                     | [PhoneInput](../../src/shared/ui/customer/phone-input/UiPhoneInput.vue), [OtpInput](../../src/shared/ui/customer/otp-input/UiOtpInput.vue)                                                                                   |
| Dialog/progress/message | `UiDialog` принимает `modelValue`, необязательные `label` и `returnFocusTo`, сообщает `update:modelValue`; consumer повтора заказа передаёт actual trigger. Browser-проверка подтверждает контекстное имя и возврат фокуса после Escape/Отмены. Progress и field message показывают состояние вызывающего | [Dialog](../../src/shared/ui/customer/dialog/UiDialog.vue), [dialog spec](../../src/shared/ui/customer/dialog/UiDialog.spec.ts), [OrderPage](../../src/pages/OrderPage.vue), [order spec](../../src/pages/OrderPage.spec.ts) |

`AuthGatePrompt`, `UiPhoneInput`, `UiOtpInput`, `UiSurfaceCard` и `UiToggle` не
имеют runtime consumer и не описывают активный пользовательский
путь. Их props описывают layout, confirm, model
value, перенос текста и disabled/model state; AuthForm использует
`UiTextField`, не phone/OTP primitives. [Источники: shell](../../src/widgets/customer-shell/CustomerShell.vue),
[phone](../../src/shared/ui/customer/phone-input/UiPhoneInput.vue), [OTP](../../src/shared/ui/customer/otp-input/UiOtpInput.vue),
[surface](../../src/shared/ui/customer/surface-card/UiSurfaceCard.vue), [toggle](../../src/shared/ui/customer/toggle/UiToggle.vue), [prompt](../../src/features/auth/AuthGatePrompt.vue), [form](../../src/features/auth/AuthForm.vue).

Минимальная ширина body — 320px. Shell остаётся full-page на всех ширинах;
reduced motion отключает анимации. Контентные
компоненты отвечают за own overflow/wrap. Канонические Customer tokens находятся
в [customer-tokens.css](../../src/styles/customer-tokens.css), импортируются
[main.css](../../src/styles/main.css), а статический адаптер Vuetify — в
[vuetify.ts](../../src/app/plugins/vuetify.ts). Используйте существующий
семантический token для изменяемых цвета, отступа, границы, radius и override;
исключения задаёт [Vue-code-style](../../../docs/40-quality/Vue-code-style.md).
Пользовательские сообщения и пропорциональный feedback задают
[preferences](../../../docs/40-quality/Product-quality-preferences.md).

`role`, `aria-*` и live region фиксируются там, где их задаёт компонент.
UiDialog задаёт доступное имя через `label`; `returnFocusTo` связывает текущий
runtime consumer с фактическим trigger. В Chrome browser-проверка подтверждает
Escape и «Отмена» для повтора заказа; она не заявляет screen-reader semantics.
