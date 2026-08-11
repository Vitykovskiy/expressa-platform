import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UiFieldMessage from "@/shared/ui/customer/field-message/UiFieldMessage.vue";
const meta = {
  title: "Components/Atoms/FieldMessage",
  component: UiFieldMessage,
  args: { message: "Мы отправим код в сообщении.", tone: "neutral" },
  argTypes: {
    message: { control: "text" },
    tone: {
      control: "select",
      options: ["neutral", "info", "warning", "error", "success"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Текстовое сообщение поля. Контракт: message и tone; empty не создаёт смыслового сообщения. Используйте для подсказки или ошибки рядом с полем, валидация остаётся у формы. Accessibility: текст должен объяснять действие. Источник: src/shared/ui/customer/field-message/UiFieldMessage.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UiFieldMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = {
  args: { message: "Введите номер полностью.", tone: "error" },
};
export const Empty: Story = { args: { message: "" } };
