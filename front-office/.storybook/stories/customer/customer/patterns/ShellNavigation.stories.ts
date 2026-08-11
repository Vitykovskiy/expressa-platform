import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ShellNavigation from "@/widgets/customer-shell/ShellNavigation.vue";
import { createCustomerDefaults } from "../fixtures/customer.fixtures";
import type {
  ShellNavigationCategory,
  ShellNavigationDestination,
} from "@/widgets/customer-shell/ShellNavigation.types";

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
    onBack: () => undefined,
    onNavigate: () => undefined,
    onSelectCategory: () => undefined,
    onSignOut: () => undefined,
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
          "Навигация Customer shell. Контракт: активный пункт, категории, счётчик, auth и события back/navigate/selectCategory/signOut; переходы решает host. Mobile и desktop меняют компоновку, sign-out доступен authenticated desktop. Accessibility: именованные кнопки и active state. Источник: src/widgets/customer-shell/ShellNavigation.vue.",
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

export const Default: Story = {};

export const EmptyCart: Story = {
  args: { cartCount: 0 },
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
};
