import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import type {
  Category,
  Product,
} from "../../../admin/pages/menu/catalog.types";
import MenuCategoryGroup from "../../../admin/pages/menu/MenuCategoryGroup.vue";

const category: Category = {
  id: "coffee",
  name: "Кофе",
  description: "Горячие напитки",
  sortOrder: 0,
  isActive: true,
};
const products: readonly Product[] = [
  {
    id: "cappuccino",
    categoryId: "coffee",
    type: "DRINK",
    name: "Капучино",
    description: "",
    priceMinor: null,
    sortOrder: 0,
    isActive: true,
    isAvailable: true,
    variants: [
      {
        id: "s",
        productId: "cappuccino",
        size: "S",
        priceMinor: 19000,
        sortOrder: 0,
        isAvailable: true,
      },
      {
        id: "m",
        productId: "cappuccino",
        size: "M",
        priceMinor: 22000,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        id: "l",
        productId: "cappuccino",
        size: "L",
        priceMinor: 25000,
        sortOrder: 2,
        isAvailable: true,
      },
    ],
  },
];
const meta = {
  title: "Admin/Menu/Parts",
  component: MenuCategoryGroup,
  parameters: { layout: "fullscreen" },
  args: {
    canMoveUp: true,
    canMoveDown: true,
    disabled: false,
  },
} satisfies Meta<typeof MenuCategoryGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Collapsed: Story = {
  args: {
    category,
    products,
    expanded: false,
    onToggle: fn(),
    "onEdit-category": fn(),
    onEdit: fn(),
    onMoveUp: fn(),
    onMoveDown: fn(),
    onMoveProductUp: fn(),
    onMoveProductDown: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      name: "Кофе 1 товар",
    });
    await userEvent.click(toggle);
    await expect(args.onToggle).toHaveBeenCalledWith(category);
    await userEvent.click(
      canvas.getByRole("button", { name: "Редактировать категорию Кофе" }),
    );
    await expect(args["onEdit-category"]).toHaveBeenCalledWith(category);
  },
};
export const ExpandedDrinkSML: Story = {
  args: {
    category,
    products,
    expanded: true,
    onToggle: fn(),
    "onEdit-category": fn(),
    onEdit: fn(),
    onMoveUp: fn(),
    onMoveDown: fn(),
    onMoveProductUp: fn(),
    onMoveProductDown: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("S: 190 ₽ · M: 220 ₽ · L: 250 ₽"),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Редактировать товар Капучино" }),
    );
    await expect(args.onEdit).toHaveBeenCalledWith(products[0]);
    await userEvent.click(
      canvas.getByRole("button", { name: "Переместить категорию Кофе вверх" }),
    );
    await expect(args.onMoveUp).toHaveBeenCalledWith(category);
    await userEvent.click(
      canvas.getByRole("button", { name: "Переместить категорию Кофе вниз" }),
    );
    await expect(args.onMoveDown).toHaveBeenCalledWith(category);
  },
};
export const Empty: Story = {
  args: { category, products: [], expanded: true },
};
export const LongContent: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    category: {
      ...category,
      name: "Очень длинное название категории для узкого экрана и проверки переноса",
    },
    products: [
      {
        ...products[0],
        name: "Очень длинное название напитка с подробным описанием состава",
      },
    ],
    expanded: true,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const categoryGroup = canvasElement.querySelector(".menu-category");

    if (!categoryGroup) throw new Error("Menu category is not rendered");
    const categoryControls = [
      "Переместить категорию Очень длинное название категории для узкого экрана и проверки переноса вверх",
      "Переместить категорию Очень длинное название категории для узкого экрана и проверки переноса вниз",
      "Редактировать категорию Очень длинное название категории для узкого экрана и проверки переноса",
    ].map((name) => canvasElement.querySelector(`[aria-label="${name}"]`));
    const controls = [
      categoryGroup.querySelector(".menu-category__toggle"),
      ...categoryControls,
    ];

    controls.forEach((control) => {
      if (!control) throw new Error("Menu category control is not rendered");
      const bounds = control.getBoundingClientRect();
      const categoryBounds = categoryGroup.getBoundingClientRect();

      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.left).toBeGreaterThanOrEqual(categoryBounds.left);
      expect(bounds.right).toBeLessThanOrEqual(categoryBounds.right);
      expect(control).toBeDisabled();
    });
    await expect(categoryGroup.scrollWidth).toBeLessThanOrEqual(
      categoryGroup.clientWidth,
    );
  },
};
