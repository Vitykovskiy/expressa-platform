import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import UiPhoneInput from "@/shared/ui/customer/phone-input/UiPhoneInput.vue";
const meta = {
  title: "Components/Atoms/PhoneInput",
  component: UiPhoneInput,
  args: {
    modelValue: "",
    label: "Номер телефона",
    disabled: false,
    readonly: false,
    loading: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    modelValue: { control: "text" },
    label: { control: "text" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    loading: { control: "boolean" },
    "onUpdate:modelValue": { action: "update:modelValue" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Ввод номера телефона. Контракт: modelValue, label, disabled, readonly, loading, update:modelValue и loader slot. Используйте для телефона; формат и серверная валидация остаются у формы. Accessibility: label и мобильная клавиатура. Источник: src/shared/ui/customer/phone-input/UiPhoneInput.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UiPhoneInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { modelValue: "79991234567" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const WithLoader: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { UiPhoneInput },
    setup: () => ({ args }),
    template:
      '<UiPhoneInput v-bind="args"><template #loader><span>Загрузка</span></template></UiPhoneInput>',
  }),
};
