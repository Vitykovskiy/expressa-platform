import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createMenuFixtures } from "../fixtures";
import MenuCategoryGroup from "../../../admin/pages/menu/MenuCategoryGroup.vue";

const items = createMenuFixtures();
const coffee = items.filter((item) => item.category === "Кофе");
const options = items.filter((item) => item.category === "Добавки");
const meta = {
  title: "Admin/Menu/Parts",
  component: MenuCategoryGroup,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Группа меню. Public props: category, items, expanded; events: toggle, edit-category и edit. LongNarrow проверяет перенос на mobile; fixtures не являются public controls.",
      },
    },
  },
  argTypes: {
    category: { control: "text" },
    items: { control: "object" },
    expanded: { control: "boolean" },
    onToggle: { action: "toggle" },
    "onEdit-category": { action: "editCategory" },
    onEdit: { action: "edit" },
  },
} satisfies Meta<typeof MenuCategoryGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    category: "Кофе",
    items: coffee,
    expanded: false,
    onToggle: fn(),
    "onEdit-category": fn(),
    onEdit: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      expanded: false,
      name: /Кофе/i,
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Капучино")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Enter}");
    await expect(args.onToggle).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(" ");
    await expect(args.onToggle).toHaveBeenCalledTimes(3);
    await userEvent.click(
      canvas.getByRole("button", { name: "Редактировать группу Кофе" }),
    );
    await expect(args["onEdit-category"]).toHaveBeenCalledWith("Кофе");
  },
};

export const ExpandedOptionGroup: Story = {
  args: {
    category: "Добавки",
    items: options,
    expanded: true,
    onToggle: fn(),
    "onEdit-category": fn(),
    onEdit: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const product = canvas.getByRole("button", { name: /Сахар/i });
    await userEvent.click(product);
    await expect(args.onEdit).toHaveBeenCalledWith(options[0]);
  },
};

export const Empty: Story = {
  args: { category: "Пустая группа", items: [], expanded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { expanded: true, name: /Пустая группа/i }),
    ).toBeVisible();
    await expect(
      canvas.getByText("Товаров в этой группе пока нет"),
    ).toBeVisible();
  },
};
export const LongNarrow: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    category: "Очень длинное название группы меню для узкого экрана",
    items: coffee,
    expanded: false,
  },
  play: async ({ canvasElement }) => {
    const category = canvasElement.querySelector(".menu-category");
    if (!category) throw new Error("Menu category is not rendered");
    await expect(category.scrollWidth).toBeLessThanOrEqual(
      category.clientWidth,
    );
  },
};
