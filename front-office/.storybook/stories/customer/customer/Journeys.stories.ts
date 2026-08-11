import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";
import CustomerJourneyHost from "./hosts/CustomerJourneyHost.vue";
import {
  createCustomerShellSeed,
  createPopulatedCartItems,
} from "./fixtures/customer.fixtures";
import type {
  CustomerJourneyScreen,
  CustomerJourneySeed,
} from "./hosts/CustomerJourneyHost.types";

type InitialScreen = "menu" | "product" | "cart" | "slot" | "orders";
type NavigationPreset = "none" | "menu" | "group" | "product";

type JourneyArgs = {
  initialScreen: InitialScreen;
  navigationPreset: NavigationPreset;
  authenticated: boolean;
  cartPopulated: boolean;
  selectedSlotId: string | null;
  productId: "cappuccino" | "latte";
  groupId: "milk-drinks" | "espresso";
};

type JourneyStoryArgs = JourneyArgs & { seed?: CustomerJourneySeed };

function screen(args: JourneyArgs): CustomerJourneyScreen {
  if (args.initialScreen === "product") {
    return {
      id: "product",
      groupId: args.groupId,
      itemId: args.productId,
    };
  }

  return { id: args.initialScreen };
}

function navigationStack(args: JourneyArgs): CustomerJourneyScreen[] {
  if (args.navigationPreset === "menu") return [{ id: "menu" }];
  if (args.navigationPreset === "group") {
    return [{ id: "menu" }, { id: "group", groupId: args.groupId }];
  }
  if (args.navigationPreset === "product") {
    return [
      { id: "menu" },
      { id: "group", groupId: args.groupId },
      {
        id: "product",
        groupId: args.groupId,
        itemId: args.productId,
      },
    ];
  }

  return [];
}

const meta = {
  title: "Customer/Journeys/CustomerShell",
  component: CustomerJourneyHost,
  args: {
    initialScreen: "menu",
    navigationPreset: "none",
    authenticated: false,
    cartPopulated: false,
    selectedSlotId: null,
    productId: "cappuccino",
    groupId: "milk-drinks",
  },
  argTypes: {
    seed: { control: false, table: { disable: true } },
    initialScreen: {
      control: "select",
      options: ["menu", "product", "cart", "slot", "orders"],
      description: "Initial screen.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "menu" },
        type: { summary: "InitialScreen" },
      },
    },
    navigationPreset: {
      control: "select",
      options: ["none", "menu", "group", "product"],
      description:
        "Детерминированный back origin, внутренне отображаемый в navigationStack.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "none" },
        type: { summary: "NavigationPreset" },
      },
    },
    authenticated: {
      control: "boolean",
      description: "Начальная подтверждённость auth.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "false" },
        type: { summary: "boolean" },
      },
    },
    cartPopulated: {
      control: "boolean",
      description: "Начальное наполнение корзины.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "false" },
        type: { summary: "boolean" },
      },
    },
    selectedSlotId: {
      control: "text",
      description: "Начальный id выбранного слота.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "null" },
        type: { summary: "string | null" },
      },
    },
    productId: {
      control: "select",
      options: ["cappuccino", "latte"],
      description: "Товар product screen.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "cappuccino" },
        type: { summary: "ProductId" },
      },
    },
    groupId: {
      control: "select",
      options: ["milk-drinks", "espresso"],
      description: "Категория product screen.",
      table: {
        category: "Initialization",
        defaultValue: { summary: "milk-drinks" },
        type: { summary: "GroupId" },
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: integration journeys CustomerShell. Перечисленные flat-поля — controls и входы story-only CustomerJourneyHost; seed внутренний, строится только adapter. Используйте для navigation, protected auth resume и sign-out. CustomerJourneyHost владеет transition, validation и error состояниями; CustomerShell остаётся pure layout. navigationPreset внутренне строит детерминированный navigationStack, host remounts при изменении flat controls. Edge: unauth protected target открывает gate, confirm ведёт auth и resume, cancel возвращает origin. Accessibility: native named controls, aria navigation; responsive shell меняет mobile header и desktop sidebar. Sign-out доступен только в desktop sidebar, поэтому полный sign-out/back flow проверяется от 1024px; на mobile он неприменим. Источник: .storybook/stories/customer/hosts/CustomerJourneyHost.vue, .storybook/stories/customer/Journeys.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { CustomerJourneyHost },
    setup: () => {
      const seed = computed(() =>
        createCustomerShellSeed({
          currentScreen: screen(args),
          navigationStack: navigationStack(args),
          ...(args.authenticated
            ? {
                auth: {
                  step: "success",
                  name: "Клиент",
                  phone: "+7 (900) 123-45-67",
                  errorMessage: "",
                  verified: true,
                },
              }
            : {}),
          ...(args.cartPopulated
            ? { cartItems: createPopulatedCartItems() }
            : {}),
          ...(args.selectedSlotId
            ? { selectedSlotId: args.selectedSlotId }
            : {}),
        }),
      );
      const key = computed(() => JSON.stringify(args));

      return { key, seed };
    },
    template: '<CustomerJourneyHost :key="key" :seed="seed" />',
  }),
} satisfies Meta<JourneyStoryArgs>;

export default meta;
type Story = StoryObj<JourneyStoryArgs>;

export const AuthenticatedNavigationStack: Story = {
  args: {
    initialScreen: "product",
    navigationPreset: "group",
    authenticated: true,
    cartPopulated: true,
  },
};

export const AuthenticatedNavigationStackView: Story = {
  args: {
    initialScreen: "product",
    navigationPreset: "group",
    authenticated: true,
    cartPopulated: true,
  },
};

export const CartQuantityUpdate: Story = {
  args: {
    initialScreen: "cart",
    navigationPreset: "none",
    authenticated: true,
    cartPopulated: true,
  },
};

export const ProtectedActionAuthResume: Story = {
  args: {
    initialScreen: "menu",
    navigationPreset: "none",
    cartPopulated: true,
  },
};

export const ProtectedConfirmation: Story = {
  args: { initialScreen: "menu", navigationPreset: "none" },
};

export const AuthCancelOrigin: Story = {
  args: {
    initialScreen: "menu",
    navigationPreset: "none",
    groupId: "espresso",
  },
};

export const BackStack: Story = {
  args: {
    initialScreen: "product",
    navigationPreset: "group",
    authenticated: true,
    productId: "latte",
  },
};

export const SignOutResetsProtectedHistory: Story = {
  args: {
    initialScreen: "orders",
    navigationPreset: "menu",
    authenticated: true,
  },
};
