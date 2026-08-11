import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuGroupScreen from "@/features/menu/MenuGroupScreen.vue";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";

const meta = {
  title: "Customer/Screens/MenuGroup",
  component: MenuGroupScreen,
  args: {
    category: createCustomerDefaults().categories[1]!,
    onReturnToMenu: () => undefined,
    onSelectProduct: () => undefined,
  },
  argTypes: {
    category: {
      control: "object",
      description: "Выбранная доменная категория или undefined для missing.",
    },
    onSelectProduct: {
      action: "selectProduct",
      description: "Передаёт id выбранного товара.",
    },
    onReturnToMenu: {
      action: "returnToMenu",
      description: "Возвращает в список категорий из пустой категории.",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран товаров выбранной категории. Используйте после выбора категории; не используйте без category кроме missing state. Props: category; emit/action: selectProduct, returnToMenu; slots отсутствуют. Состояния: default, missing, empty, long. Empty показывает объяснение и одно действие возврата к списку категорий; MenuFlow владеет навигацией и не показывает второй Back. Валидация принадлежит каталогу. Карточки доступны как buttons; grid responsive. Источник: src/features/menu/MenuGroupScreen.vue, src/features/menu/MenuFlow.vue, .storybook/stories/customer/MenuGroup.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MenuGroupScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missing: Story = {
  args: {
    category: undefined,
  },
};
export const Empty: Story = {
  args: {
    category: { ...createCustomerDefaults().categories[1]!, products: [] },
  },
};
export const Long: Story = {
  args: {
    category: {
      ...createCustomerDefaults().categories[1]!,
      name: "Очень длинное название категории для проверки переноса на узком экране",
      products: createCustomerDefaults().categories[1]!.products.map(
        (product, index) =>
          index === 0
            ? {
                ...product,
                name: "Капучино с очень длинным названием для проверки переноса в карточке каталога",
              }
            : product,
      ),
    },
  },
};
