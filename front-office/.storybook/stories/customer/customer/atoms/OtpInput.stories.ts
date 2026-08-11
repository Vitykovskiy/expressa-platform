import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UiOtpInput from "@/shared/ui/customer/otp-input/UiOtpInput.vue";

const meta = {
  title: "Components/Atoms/OtpInput",
  component: UiOtpInput,
  args: {
    modelValue: "",
    label: "Код из сообщения",
    disabled: false,
    readonly: false,
    loading: false,
    "onUpdate:modelValue": () => undefined,
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
          "Ввод одноразового кода. Контракт: modelValue, label, disabled, readonly, loading, update:modelValue и loader slot. Используйте для OTP; проверка кода и ошибка принадлежат форме. Accessibility: label формирует имя поля, loading блокирует ввод. Источник: src/shared/ui/customer/otp-input/UiOtpInput.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UiOtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { modelValue: "123456" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const WithLoader: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { UiOtpInput },
    setup: () => ({ args }),
    template:
      '<UiOtpInput v-bind="args"><template #loader><span>Загрузка</span></template></UiOtpInput>',
  }),
};
