import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { LoaderCircle, ShoppingCart } from "lucide-vue-next";
import { expect, fn, userEvent, within } from "storybook/test";
import UiIconBtn from "../../../customer/shared/ui/icon-btn/UiIconBtn.vue";

type IconButtonStoryArgs = {
  disabled: boolean;
  loading: boolean;
  onClick: (event: MouseEvent) => void;
};

const meta = {
  title: "Components/Atoms/IconButton",
  component: UiIconBtn,
  args: { disabled: false, loading: false, onClick: fn() },
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
          "Иконка-кнопка для компактного действия. Контракт: disabled, loading, click и slot; обязательны aria-label и 44px область. Не используйте без доступного имени. Источник: src/customer/shared/ui/icon-btn/UiIconBtn.vue.",
      },
    },
  },
  render: (args) => ({
    components: { LoaderCircle, ShoppingCart, UiIconBtn },
    setup: () => ({ args }),
    template:
      '<ui-icon-btn aria-label="Открыть корзину" data-testid="icon-button" :disabled="args.disabled" :loading="args.loading" @click="args.onClick"><template #loader><LoaderCircle role="progressbar" aria-label="Загрузка" /></template><ShoppingCart aria-hidden="true" /></ui-icon-btn>',
  }),
} satisfies Meta<IconButtonStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Открыть корзину",
    });
    await expect(button).toHaveAttribute("data-testid", "icon-button");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledWith(expect.any(MouseEvent));
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Открыть корзину",
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
      name: "Открыть корзину",
    });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(
      within(canvasElement).getByRole("progressbar", { name: "Загрузка" }),
    ).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
