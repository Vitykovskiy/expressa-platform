---
title: Барьеры Storybook
sources: [Expressa_MVP_Техническое_задание.md]
---

# Барьеры Storybook

`front-office` и `back-office` содержат собственный Storybook.

Компонентная реализация, состояния экранов и адаптивные варианты в Storybook предшествуют интеграции бизнес-функций в приложения.

Функциональная разработка клиентских экранов начинается после прохождения двух барьеров:

- **SB-FO:** согласован Storybook front-office;
- **SB-BO:** согласован Storybook back-office.

- **TR-SB-FO-001.** Front-office содержит отдельный Storybook с production-подобной темой и сборкой.
- **TR-SB-FO-002.** Storybook front-office фиксирует типографику, сетку, интервалы, иконографику, адаптивные размеры и токены Vuetify.
- **TR-SB-FO-003.** Storybook front-office содержит базовые элементы управления и все состояния, перечисленные в разделе 14.
- **TR-SB-FO-GATE.** Барьер SB-FO подтверждает полноту каталога, доступность, визуальную регрессию и согласованную публикацию.
- **TR-SB-BO-001.** Back-office содержит отдельный Storybook с production-подобной темой и сборкой.
- **TR-SB-BO-002.** Storybook back-office фиксирует рабочую типографику, сетку, плотность, статусы, адаптивные размеры и токены Vuetify.
- **TR-SB-BO-003.** Storybook back-office содержит базовые элементы управления и все состояния, перечисленные в разделе 15.
- **TR-SB-BO-GATE.** Барьер SB-BO подтверждает полноту каталога, interaction tests, доступность, визуальную регрессию и согласованную публикацию.

## Storybook front-office

Storybook front-office содержит следующие группы:

1. **Foundations:** цветовые токены, типографика, отступы, радиусы, тени, иконки, сетка.
2. **Controls:** Button, IconButton, TextField, PhoneField, OtpInput, Checkbox, Radio, Chip, QuantityStepper.
3. **Navigation:** AppHeader, CategoryNavigation, BottomActionBar.
4. **Menu:** ProductCard, PriceLabel, AvailabilityState, ProductConfigurator, ModifierGroup.
5. **Cart:** CartLine, CartSummary, CartBadge, PriceChangeNotice, AvailabilityNotice.
6. **Orders:** OrderStage, OrderCard, OrderDetails, OrderHistoryList, RepeatOrderResult.
7. **Feedback:** Skeleton, EmptyState, ErrorState, InlineError, Snackbar, Dialog, NotificationPermission.
8. **Compositions:** MenuPage, ProductSheet, CartPage, PhoneAuthPage, OtpPage, CurrentOrderPage, HistoryPage.

Каждая история покрывает применимые состояния:

- базовое;
- интерактивное;
- фокус клавиатуры;
- загрузка;
- ошибка;
- напиток с выбранным размером `M`, напиток без размера `M` и товар без размеров;
- обязательные группы с выбранными по умолчанию добавками и изменение выбора в допустимых пределах;
- полный, частичный и недоступный повтор заказа;
- [[Push-notifications|уведомления разрешены и запрещены]];
- выключенная доступность;
- длинный текст;
- крупная сумма;
- узкий экран 320 px;
- типовой мобильный экран 390 px;
- широкий экран 768 px.

Барьер SB-FO пройден при выполнении условий:

- все компоненты и композиции представлены;
- автоматическая проверка доступности проходит;
- визуальные снимки зафиксированы в CI;
- продуктовый владелец согласовал композиции и состояния.

## Storybook back-office

Storybook back-office содержит следующие группы:

1. **Foundations:** токены, типографика, сетка, плотность интерфейса, иконки.
2. **Controls:** Button, IconButton, TextField, Select, Toggle, Tabs, SearchField, ConfirmDialog.
3. **Orders:** OrderStatusBadge, OrderQueueCard, OrderQueueList, OrderDetailsPanel, OrderActionBar, EventTimeline.
4. **Availability:** AvailabilityRow, AvailabilityGroup, OrderIntakeControl, LastChangeMeta.
5. **Menu:** CategoryListItem, ProductListItem, CategoryForm, ProductForm, VariantEditor, ModifierGroupEditor, ModifierOptionEditor.
6. **Feedback:** Skeleton, EmptyState, ErrorState, Snackbar, FormErrors, NotificationPermission.
7. **Compositions:** OrdersPage, OrderDetailsView, AvailabilityPage, MenuPage, CategoryEditorPage, ProductEditorPage, StaffLoginPage.

Каждая история покрывает применимые состояния:

- пустая очередь;
- один заказ;
- плотная очередь;
- каждая стадия;
- напиток с размерами `S`, `M`, `L`, напиток только с размером `S` и товар с единой ценой;
- [[Push-notifications|уведомления разрешены и запрещены]];
- загрузка и ошибка;
- длинный состав заказа;
- планшет 768 px;
- рабочий экран 1280 px;
- широкий экран 1440 px.

Барьер SB-BO пройден при выполнении условий:

- полный каталог компонентов и композиций готов;
- действия стадий заказа и доступности покрыты интеракционными тестами;
- формы меню покрывают серверные ошибки;
- автоматическая проверка доступности проходит;
- визуальные снимки зафиксированы в CI;
- продуктовый владелец согласовал рабочие сценарии.
