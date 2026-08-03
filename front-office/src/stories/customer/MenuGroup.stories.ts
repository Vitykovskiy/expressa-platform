import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import MenuGroupScreen from "../../customer/pages/menu/MenuGroupScreen.vue";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";

const meta = {
  title: "Customer/Screens/MenuGroup",
  component: MenuGroupScreen,
  args: {
    category: createCustomerDefaults().categories[1]!,
    onSelectProduct: fn(),
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
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран товаров выбранной категории. Используйте после выбора категории; не используйте без category кроме missing state. Props: category; emit/action: selectProduct; slots отсутствуют. Состояния: default, missing, empty, long. Валидация принадлежит каталогу. Карточки доступны как buttons; grid responsive. Источник: src/customer/pages/menu/MenuGroupScreen.vue, src/stories/customer/MenuGroup.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MenuGroupScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /Капучино/ }),
    );
    await expect(args.onSelectProduct).toHaveBeenCalledTimes(1);
    await expect(args.onSelectProduct).toHaveBeenCalledWith("cappuccino");
  },
};

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
