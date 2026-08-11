import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuRootScreen from "@/features/menu/MenuRootScreen.vue";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";

const meta = {
  title: "Customer/Screens/MenuRoot",
  component: MenuRootScreen,
  args: {
    categories: createCustomerDefaults().categories,
    onSelectCategory: () => undefined,
  },
  argTypes: {
    categories: { control: "object", description: "Доменные категории меню." },
    onSelectCategory: {
      action: "selectCategory",
      description: "Передаёт id выбранной категории.",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: корневой экран меню. Используйте для выбора категории; не используйте для деталей товара. Props: categories; emit/action: selectCategory; slots отсутствуют. Состояния: default, empty, long. Валидация принадлежит данным каталога. Accessibility: категории — native buttons; responsive grid следует экрану. Источник: src/features/menu/MenuRootScreen.vue, .storybook/stories/customer/MenuRoot.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MenuRootScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { categories: [] } };
export const Long: Story = {
  args: {
    categories: [
      {
        ...createCustomerDefaults().categories[0]!,
        name: "Очень длинное название категории для проверки переноса на узком экране",
      },
    ],
  },
};
