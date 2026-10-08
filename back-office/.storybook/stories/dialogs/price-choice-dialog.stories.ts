import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import PriceChoiceDialog from "../../../src/pages/admin/menu/PriceChoiceDialog.vue";
import { dialogHost } from "../../fixtures/hosts";

const meta = {
  title: "Бизнес компоненты/Меню/Цена и порция",
  id: "dialogs-pricechoicedialog",
  component: PriceChoiceDialog,
  args: {
    choice: { portionLabel: "300 мл", price: "290", isAvailable: true },
    disabled: false,
    editing: false,
    requiredLabel: false,
    usedLabels: [],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PriceChoiceDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { PriceChoiceDialog },
    setup: () => ({
      ...dialogHost(),
      args,
      choice: shallowRef(
        args.choice ?? { portionLabel: "", price: "", isAvailable: true },
      ),
    }),
    template:
      '<PriceChoiceDialog v-bind="args" :choice="choice" v-model:open="open" />',
  };
}
export const Create: Story = { name: "Создание", render };
export const Edit: Story = {
  name: "Редактирование",
  args: {
    editing: true,
    requiredLabel: true,
    choice: {
      portionLabel: "Большой стакан 450 мл",
      price: "390",
      isAvailable: false,
    },
  },
  render,
};
export const SinglePriceWithoutLabel: Story = {
  name: "Одна цена без названия порции",
  args: {
    choice: { portionLabel: "", price: "290", isAvailable: true },
  },
  render,
};
export const RejectedPrice: Story = {
  name: "Цена отклонена",
  args: {
    editing: true,
    choice: { portionLabel: "", price: "2147483648", isAvailable: true },
    priceError: "Цена должна быть целым числом до 2147483647 ₽",
  },
  render,
};
export const RequiredBlank: Story = {
  name: "Обязательная порция без значения",
  args: {
    requiredLabel: true,
    choice: { portionLabel: "", price: "", isAvailable: true },
  },
  render,
};
export const DuplicatePortion: Story = {
  name: "Повторяющаяся порция",
  args: {
    requiredLabel: true,
    usedLabels: ["300 мл"],
    choice: { portionLabel: " 300   мл ", price: "290", isAvailable: true },
  },
  render,
};
export const LongCustom: Story = {
  name: "Длинная порция",
  args: {
    editing: true,
    requiredLabel: true,
    choice: {
      portionLabel:
        "Оченьдлиннаяпорциябезпробеловсдополнительныммолокомиразныминаполнителями500мл",
      price: "2147483647",
      isAvailable: true,
    },
  },
  render,
};
export const Pending: Story = {
  name: "Ожидание и блокировка",
  args: {
    disabled: true,
    editing: true,
    choice: { portionLabel: "300 мл", price: "290", isAvailable: false },
  },
  render,
};
