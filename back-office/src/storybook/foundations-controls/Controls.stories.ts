import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";

import ConfirmDialog from "../../shared/ui/ConfirmDialog.vue";
import OrderStatusBadge from "../../shared/ui/OrderStatusBadge.vue";
import UiButton from "../../shared/ui/UiButton.vue";
import UiIconButton from "../../shared/ui/UiIconButton.vue";
import UiSearchField from "../../shared/ui/UiSearchField.vue";
import UiSelect from "../../shared/ui/UiSelect.vue";
import UiTabs from "../../shared/ui/UiTabs.vue";
import UiTextField from "../../shared/ui/UiTextField.vue";
import UiToggle from "../../shared/ui/UiToggle.vue";
import StoryCanvas from "./StoryCanvas.vue";

const meta = {
  title: "Controls/Back office",
  component: UiButton,
} satisfies Meta<typeof UiButton>;
export default meta;
type Story = StoryObj<typeof meta>;
const components = {
  ConfirmDialog,
  OrderStatusBadge,
  StoryCanvas,
  UiButton,
  UiIconButton,
  UiSearchField,
  UiSelect,
  UiTabs,
  UiTextField,
  UiToggle,
};

export const Button: Story = {
  render: () => ({
    components,
    setup: () => ({ saved: ref(false) }),
    template: `<StoryCanvas><section class="control-page"><h1>Button</h1><div class="control-row"><UiButton @click="saved = true">Сохранить</UiButton><UiButton loading>Сохраняем</UiButton><UiButton disabled>Недоступно</UiButton></div><p v-if="saved" role="status">Изменения сохранены</p></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Сохранить" });
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    await expect(canvas.getByText("Изменения сохранены")).toBeVisible();
  },
};

export const IconButton: Story = {
  render: () => ({
    components,
    setup: () => ({ cleared: ref(false) }),
    template: `<StoryCanvas><section class="control-page"><h1>IconButton</h1><div class="control-row"><UiIconButton label="Очистить поиск" @click="cleared = true">×</UiIconButton><UiIconButton label="Справка" disabled>?</UiIconButton></div><p v-if="cleared" role="status">Поиск очищен</p></section></StoryCanvas>`,
  }),
};

export const TextField: Story = {
  render: () => ({
    components,
    setup: () => ({ invalid: ref(""), value: ref("Капучино") }),
    template: `<StoryCanvas><section class="control-page"><h1>TextField</h1><UiTextField v-model="value" label="Название товара" autocomplete="off" /><UiTextField v-model="invalid" label="Название для ошибки" error-message="Поле обязательно" /><UiTextField model-value="Кофе" label="Недоступное поле" disabled /></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Название товара" });
    await userEvent.clear(field);
    await userEvent.type(field, "Латте");
    await expect(field).toHaveValue("Латте");
  },
};

export const Select: Story = {
  render: () => ({
    components,
    setup: () => ({
      category: ref("coffee"),
      items: [
        { title: "Кофе", value: "coffee" },
        { title: "Чай", value: "tea" },
      ],
    }),
    template: `<StoryCanvas><section class="control-page"><h1>Select</h1><UiSelect v-model="category" label="Категория" :items="items" /><p role="status">Выбрана категория: {{ category }}</p><UiSelect model-value="coffee" label="Недоступная категория" :items="items" disabled /></section></StoryCanvas>`,
  }),
};

export const Toggle: Story = {
  render: () => ({
    components,
    setup: () => ({ available: ref(true) }),
    template: `<StoryCanvas><section class="control-page"><h1>Toggle</h1><UiToggle v-model="available" label="Принимать новые заказы" /><UiToggle :model-value="false" label="Приём заказов недоступен" disabled /></section></StoryCanvas>`,
  }),
};

export const Tabs: Story = {
  render: () => ({
    components,
    setup: () => ({
      active: ref("active"),
      tabs: [
        { label: "Активные", value: "active" },
        { label: "Готовые", value: "ready" },
        { disabled: true, label: "Выданные", value: "issued" },
      ],
    }),
    template: `<StoryCanvas><section class="control-page"><h1>Tabs</h1><UiTabs v-model="active" label="Фильтр очереди" :tabs="tabs" /><p role="status">Выбран фильтр: {{ active }}</p></section></StoryCanvas>`,
  }),
};

export const SearchField: Story = {
  render: () => ({
    components,
    setup: () => ({ query: ref("") }),
    template: `<StoryCanvas><section class="control-page"><h1>SearchField</h1><UiSearchField v-model="query" label="Поиск по номеру или имени" /><p role="status">{{ query ? 'Ищем: ' + query : 'Введите запрос для поиска' }}</p></section></StoryCanvas>`,
  }),
};

export const Confirm: Story = {
  render: () => ({
    components,
    setup: () => ({ confirmed: ref(false), open: ref(false) }),
    template: `<StoryCanvas><section class="control-page"><h1>ConfirmDialog</h1><UiButton @click="open = true">Выдать заказ #1048</UiButton><ConfirmDialog v-model="open" title="Выдать заказ?" message="Заказ исчезнет из активной очереди." confirm-label="Подтвердить выдачу" @confirm="confirmed = true" /><p v-if="confirmed" role="status">Заказ #1048 выдан</p></section></StoryCanvas>`,
  }),
};

export const OrderStages: Story = {
  render: () => ({
    components,
    template: `<StoryCanvas><section class="control-page"><h1>Стадии заказа</h1><div class="status-list" role="list"><OrderStatusBadge v-for="status in ['created', 'accepted', 'preparing', 'ready', 'issued']" :key="status" :status="status" role="listitem" /></div></section></StoryCanvas>`,
  }),
};
