import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ArrowRight, ShoppingCart } from "lucide-vue-next";
import { expect, fn, userEvent, within } from "storybook/test";
import UiBtn from "../../../customer/shared/ui/btn/UiBtn.vue";

type ButtonStoryArgs = {
  disabled: boolean;
  loading: boolean;
  onClick: (event: MouseEvent) => void;
};

const meta = {
  title: "Components/Atoms/Button",
  component: UiBtn,
  args: {
    disabled: false,
    loading: false,
    onClick: fn(),
  },
  argTypes: {
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    onClick: { action: "click" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Кнопка действий Customer. Контракт: disabled, loading, click и slots; loading блокирует повторное действие. Используйте для именованных действий, не для навигационной ссылки. Accessibility: доступное имя и disabled. Источник: src/customer/shared/ui/btn/UiBtn.vue.",
      },
    },
  },
  render: (args) => ({
    components: { ArrowRight, ShoppingCart, UiBtn },
    setup: () => ({ args }),
    template:
      '<ui-btn data-testid="customer-button" color="primary" variant="flat" :disabled="args.disabled" :loading="args.loading" @click="args.onClick"><template #loader><span role="progressbar" /></template><ShoppingCart aria-hidden="true" /><span>Продолжить</span><ArrowRight aria-hidden="true" /></ui-btn>',
  }),
} satisfies Meta<ButtonStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Продолжить",
    });
    await expect(button).toHaveAttribute("data-testid", "customer-button");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledWith(expect.any(MouseEvent));
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Продолжить",
    });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Продолжить",
    });
    await expect(button).toBeDisabled();
    await expect(within(canvasElement).getByRole("progressbar")).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
