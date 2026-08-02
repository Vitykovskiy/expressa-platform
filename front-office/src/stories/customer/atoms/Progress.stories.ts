import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UiProgress from "../../../customer/shared/ui/progress/UiProgress.vue";
const meta = {
  title: "Components/Atoms/Progress",
  component: UiProgress,
  args: {
    label: "Прогресс оформления заказа",
    modelValue: 50,
    kind: "linear",
    color: "primary",
    rounded: true,
    indeterminate: false,
  },
  argTypes: {
    label: { control: "text" },
    modelValue: { control: { type: "range", min: 0, max: 100 } },
    kind: { control: "select", options: ["linear", "circular"] },
    color: { control: "text" },
    rounded: { control: "boolean" },
    indeterminate: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Индикатор процесса. Контракт: label, modelValue, kind, color, rounded и indeterminate; значение ограничено 0–100. Используйте при ожидании, не вместо результата или ошибки. Accessibility: label обязателен, indeterminate не сообщает ложный процент. Источник: src/customer/shared/ui/progress/UiProgress.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UiProgress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Spinner: Story = {
  args: { kind: "circular", indeterminate: true },
};
