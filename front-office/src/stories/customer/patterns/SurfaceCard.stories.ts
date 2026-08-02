import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UiSurfaceCard from "../../../customer/shared/ui/surface-card/UiSurfaceCard.vue";
const meta = {
  title: "Components/Patterns/SurfaceCard",
  component: UiSurfaceCard,
  args: {
    title: "Заказ №1042",
    content: "Капучино и круассан",
    footer: "Сегодня, 12:30",
    muted: false,
  },
  argTypes: {
    title: { control: "text" },
    content: { control: "text" },
    footer: { control: "text" },
    muted: { control: "boolean" },
    default: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Нейтральная surface-карточка. Контракт: title, content, footer, muted и default slot. Используйте для компактного блока содержимого, не для интерактивного действия. Empty и muted — presentation states; доступность текста обеспечивает вызывающий экран. Источник: src/customer/shared/ui/surface-card/UiSurfaceCard.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UiSurfaceCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { title: "", content: "", footer: "" } };
export const Muted: Story = { args: { muted: true } };
export const WithDefaultSlot: Story = {
  render: (args) => ({
    components: { UiSurfaceCard },
    setup: () => ({ args }),
    template:
      '<UiSurfaceCard v-bind="args"><strong>Содержимое слота</strong></UiSurfaceCard>',
  }),
};
