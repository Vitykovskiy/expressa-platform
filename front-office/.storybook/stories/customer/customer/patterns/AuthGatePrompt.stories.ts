import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import AuthGatePrompt from "@/features/auth/AuthGatePrompt.vue";
import type { AuthGatePromptProps } from "@/features/auth/AuthGatePrompt.types";

type AuthGatePromptStoryArgs = AuthGatePromptProps & {
  onConfirm: () => void;
};

const meta = {
  title: "Components/Patterns/AuthGatePrompt",
  component: AuthGatePrompt,
  args: {
    title: "Требуется подтверждение",
    message:
      "Для доступа к этому разделу необходимо подтвердить номер телефона.",
    note: "Вход по номеру телефона: вы получите одноразовый код для подтверждения.",
    confirmLabel: "Подтвердить номер телефона",
    onConfirm: fn(),
  },
  argTypes: {
    title: { control: "text" },
    message: { control: "text" },
    note: { control: "text" },
    confirmLabel: { control: "text" },
    onConfirm: { action: "confirm" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Запрос подтверждения перед защищённым действием. Контракт: title, message, note, confirmLabel и confirm; переход после confirm решает host. Показывает длинный текст без потери действия. Accessibility: кнопка имеет имя. Источник: src/features/auth/AuthGatePrompt.vue.",
      },
    },
  },
  render: (args) => ({
    components: { AuthGatePrompt },
    setup: () => ({ args }),
    template:
      '<AuthGatePrompt :title="args.title" :message="args.message" :note="args.note" :confirm-label="args.confirmLabel" @confirm="args.onConfirm" />',
  }),
} satisfies Meta<AuthGatePromptStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Confirm: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Подтвердить номер телефона",
      }),
    );

    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const Long: Story = {
  args: {
    message:
      "Для доступа к истории и оформлению заказа необходимо подтвердить номер телефона.",
    note: "Вход по номеру телефона: вы получите одноразовый код для подтверждения и сможете продолжить.",
  },
};
