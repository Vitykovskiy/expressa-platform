import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import UiBadge from "@/shared/ui/customer/badge/UiBadge.vue";

type UiBadgeStoryArgs = {
  tone: "neutral" | "info" | "warning" | "success" | "error";
};

const meta = {
  title: "Components/Atoms/UiBadge",
  component: UiBadge,
  args: { tone: "info" },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "info", "warning", "success", "error"],
    },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Краткая статусная метка. Контракт: tone и default slot. Используйте для понятного текста состояния, не полагайтесь только на цвет. Источник: src/shared/ui/customer/badge/UiBadge.vue.",
      },
    },
  },
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template:
      '<ui-badge data-testid="badge" :tone="args.tone">Метка</ui-badge>',
  }),
} satisfies Meta<UiBadgeStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Метка")).toHaveAttribute(
      "data-testid",
      "badge",
    );
  },
};

export const Success: Story = { args: { tone: "success" } };
export const Error: Story = { args: { tone: "error" } };
