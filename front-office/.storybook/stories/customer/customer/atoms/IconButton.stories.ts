import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { LoaderCircle, ShoppingCart } from "lucide-vue-next";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";

type IconButtonStoryArgs = {
  disabled: boolean;
  loading: boolean;
  onClick: (event: MouseEvent) => void;
};

const meta = {
  title: "Components/Atoms/IconButton",
  component: UiIconBtn,
  args: { disabled: false, loading: false, onClick: () => undefined },
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
          "Иконка-кнопка для компактного действия. Контракт: disabled, loading, click и slot; обязательны aria-label и 44px область. Не используйте без доступного имени. Источник: src/shared/ui/customer/icon-btn/UiIconBtn.vue.",
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

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};
