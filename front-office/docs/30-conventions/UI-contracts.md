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

| Контракт                | Поведение, данные и состояния                                                                                                                                                                                         | Источник и проверка                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Shell/navigation        | отображает маршрутную область и навигацию; активный пункт и ссылка доступны клавиатуре                                                                                                                                | [shell](../../src/widgets/customer-shell/CustomerShell.vue), [navigation](../../src/widgets/customer-shell/ShellNavigation.vue)            |
| Button/icon button      | `disabled`/`loading` блокируют действие; icon button требует доступного имени                                                                                                                                         | [UiBtn](../../src/shared/ui/customer/btn/UiBtn.vue), [UiIconBtn](../../src/shared/ui/customer/icon-btn/UiIconBtn.vue)                      |
| Phone/OTP поля          | оба принимают `modelValue`, `label`, `loading`, `disabled`, `readonly` и испускают только `update:modelValue`; loading отключает поле, phone задаёт tel/inputmode/auto-complete, OTP оставляет цифры и максимум шесть | [PhoneInput](../../src/shared/ui/customer/phone-input/UiPhoneInput.vue), [OtpInput](../../src/shared/ui/customer/otp-input/UiOtpInput.vue) |
| Dialog/progress/message | dialog открывается/закрывается событием, progress и field message показывают состояние вызывающего                                                                                                                    | [Dialog](../../src/shared/ui/customer/dialog/UiDialog.vue), [Progress](../../src/shared/ui/customer/progress/UiProgress.vue)               |

`AuthGatePrompt`, `UiPhoneInput`, `UiOtpInput`, `UiSurfaceCard`,
`UiToggle` и `UiDialog` не имеют runtime consumer: это story-only contracts,
не активный пользовательский путь. Их props описывают layout, confirm, model
value, перенос текста и disabled/model state; AuthForm использует
`UiTextField`, не phone/OTP primitives. [Источники: shell](../../src/widgets/customer-shell/CustomerShell.vue),
[phone](../../src/shared/ui/customer/phone-input/UiPhoneInput.vue), [OTP](../../src/shared/ui/customer/otp-input/UiOtpInput.vue),
[surface](../../src/shared/ui/customer/surface-card/UiSurfaceCard.vue), [toggle](../../src/shared/ui/customer/toggle/UiToggle.vue), [prompt](../../src/features/auth/AuthGatePrompt.vue), [form](../../src/features/auth/AuthForm.vue).

Минимальная ширина body — 320px. На 480px приложение становится карточкой, на
1024px возвращается full-page; reduced motion отключает анимации. Контентные
компоненты отвечают за own overflow/wrap, а токены — за цвет, spacing, типографику
и breakpoint. [Источники: main CSS](../../src/styles/main.css), [tokens](../../src/styles/customer-tokens.css).

`role`, `aria-*` и live region фиксируются там, где их задаёт компонент.
[Источник: UI](../../src/shared/ui/customer/dialog/UiDialog.vue).
