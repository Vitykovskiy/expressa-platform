import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ShellNavigation from "../../../customer/shell/ShellNavigation.vue";
import { createCustomerDefaults } from "../fixtures/customer.fixtures";
import type {
  ShellNavigationCategory,
  ShellNavigationDestination,
} from "../../../customer/shell/ShellNavigation.types";

type ShellNavigationStoryArgs = {
  activeDestination: ShellNavigationDestination;
  categories: ShellNavigationCategory[];
  cartCount: number;
  isAuthenticated: boolean;
  accountLabel: string;
  selectedCategoryId?: string;
  showBack: boolean;
  onBack: () => void;
  onNavigate: (destination: ShellNavigationDestination) => void;
  onSelectCategory: (categoryId: string) => void;
  onSignOut: () => void;
};

const categories = createCustomerDefaults().categories;

const meta = {
  title: "Components/Patterns/ShellNavigation",
  component: ShellNavigation,
  args: {
    activeDestination: "menu",
    categories,
    cartCount: 2,
    isAuthenticated: false,
    accountLabel: "Подтвердить телефон",
    showBack: false,
    onBack: fn(),
    onNavigate: fn(),
    onSelectCategory: fn(),
    onSignOut: fn(),
  },
  argTypes: {
    activeDestination: {
      control: "select",
      options: ["menu", "cart", "orders"],
    },
    categories: { control: "object" },
    cartCount: { control: "number" },
    isAuthenticated: { control: "boolean" },
    accountLabel: { control: "text" },
    selectedCategoryId: { control: "text" },
    showBack: { control: "boolean" },
    onBack: { action: "back" },
    onNavigate: { action: "navigate" },
    onSelectCategory: { action: "selectCategory" },
    onSignOut: { action: "signOut" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Навигация Customer shell. Контракт: активный пункт, категории, счётчик, auth и события back/navigate/selectCategory/signOut; переходы решает host. Mobile и desktop меняют компоновку, sign-out доступен authenticated desktop. Accessibility: именованные кнопки и active state. Источник: src/customer/shell/ShellNavigation.vue.",
      },
    },
  },
  render: (args) => ({
    components: { ShellNavigation },
    setup: () => ({ args }),
    template:
      '<ShellNavigation :active-destination="args.activeDestination" :categories="args.categories" :cart-count="args.cartCount" :is-authenticated="args.isAuthenticated" :account-label="args.accountLabel" :selected-category-id="args.selectedCategoryId" :show-back="args.showBack" @back="args.onBack" @navigate="args.onNavigate" @select-category="args.onSelectCategory" @sign-out="args.onSignOut" />',
  }),
} satisfies Meta<ShellNavigationStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const cart = canvas.getByRole("button", {
      name: "Корзина, 2 товара",
    });
    const badges = canvasElement.querySelectorAll(".shell-navigation__badge");

    await expect([...badges].every((badge) => badge.textContent === "2")).toBe(
      true,
    );
    await userEvent.click(cart);
    await expect(args.onNavigate).toHaveBeenCalledWith("cart");
  },
};

export const EmptyCart: Story = {
  args: { cartCount: 0 },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "Корзина" }),
    ).toBeVisible();
  },
};

export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
    accountLabel: "Клиент",
  },
};

export const SelectedCategory: Story = {
  args: {
    selectedCategoryId: categories[0]!.id,
    showBack: true,
  },
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const isDesktop = canvasElement.ownerDocument.defaultView?.matchMedia(
      "(min-width: 1024px)",
    ).matches;

    if (isDesktop) {
      const selectedCategory = canvasElement.querySelector(
        ".shell-navigation__category-nav .shell-navigation__nav-button--active",
      );

      await expect(selectedCategory).toHaveTextContent(categories[0]!.name);
      await userEvent.click(
        canvas.getByRole("button", { name: categories[0]!.name }),
      );
      await expect(args.onSelectCategory).toHaveBeenCalledWith(
        categories[0]!.id,
      );
    } else {
      await userEvent.click(canvas.getByRole("button", { name: "Назад" }));
      await expect(args.onBack).toHaveBeenCalledTimes(1);
    }
  },
};
