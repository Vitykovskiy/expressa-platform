import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { createPinia, setActivePinia } from "pinia";

import { createNavigationItems } from "../../../../src/app/navigation";
import { useCatalogStore } from "../../../../src/pages/admin/menu/catalog.store";
import type { CatalogApiResult } from "../../../../src/pages/admin/menu/catalog.types";
import AdminShell from "../../../../src/widgets/admin-shell/AdminShell.vue";
import MenuPage from "../../../../src/pages/MenuPage.vue";

const populatedCatalog = {
  categories: [
    {
      id: "coffee",
      name: "Кофе",
      description: "Горячие напитки",
      sortOrder: 0,
      isActive: true,
    },
    {
      id: "bakery",
      name: "Выпечка",
      description: "Свежая выпечка",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "desserts",
      name: "Десерты",
      description: "Сладкое к напитку",
      sortOrder: 2,
      isActive: true,
    },
  ],
  products: [
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
          id: "cappuccino-s",
          productId: "cappuccino",
          size: "S",
          priceMinor: 18000,
          sortOrder: 0,
          isAvailable: true,
        },
        {
          id: "cappuccino-m",
          productId: "cappuccino",
          size: "M",
          priceMinor: 22000,
          sortOrder: 1,
          isAvailable: true,
        },
        {
          id: "cappuccino-l",
          productId: "cappuccino",
          size: "L",
          priceMinor: 26000,
          sortOrder: 2,
          isAvailable: true,
        },
      ],
    },
    {
      id: "latte",
      categoryId: "coffee",
      type: "DRINK",
      name: "Латте",
      description: "",
      priceMinor: null,
      sortOrder: 1,
      isActive: true,
      isAvailable: true,
      variants: [
        {
          id: "latte-s",
          productId: "latte",
          size: "S",
          priceMinor: 20000,
          sortOrder: 0,
          isAvailable: true,
        },
        {
          id: "latte-m",
          productId: "latte",
          size: "M",
          priceMinor: 24000,
          sortOrder: 1,
          isAvailable: true,
        },
        {
          id: "latte-l",
          productId: "latte",
          size: "L",
          priceMinor: 28000,
          sortOrder: 2,
          isAvailable: true,
        },
      ],
    },
    {
      id: "espresso",
      categoryId: "coffee",
      type: "OTHER",
      name: "Эспрессо",
      description: "",
      priceMinor: 15000,
      sortOrder: 2,
      isActive: true,
      isAvailable: true,
      variants: [],
    },
    {
      id: "croissant",
      categoryId: "bakery",
      type: "OTHER",
      name: "Круассан",
      description: "",
      priceMinor: 16000,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      variants: [],
    },
    {
      id: "cheesecake",
      categoryId: "desserts",
      type: "OTHER",
      name: "Чизкейк",
      description: "",
      priceMinor: 28000,
      sortOrder: 0,
      isActive: true,
      isAvailable: false,
      variants: [],
    },
  ],
  modifierGroups: [
    {
      id: "milk",
      name: "Тип молока",
      selectionType: "single",
      minSelect: 0,
      maxSelect: 1,
      isActive: true,
      options: [
        {
          id: "milk-regular",
          groupId: "milk",
          name: "Молоко",
          priceDeltaMinor: 0,
          sortOrder: 0,
          isDefault: true,
          isAvailable: true,
        },
        {
          id: "milk-soy",
          groupId: "milk",
          name: "Соевое молоко",
          priceDeltaMinor: 3000,
          sortOrder: 1,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "milk-almond",
          groupId: "milk",
          name: "Миндальное молоко",
          priceDeltaMinor: 4000,
          sortOrder: 2,
          isDefault: false,
          isAvailable: true,
        },
      ],
    },
    {
      id: "additions",
      name: "Добавки",
      selectionType: "multiple",
      minSelect: 0,
      maxSelect: 3,
      isActive: true,
      options: [
        {
          id: "addition-sugar",
          groupId: "additions",
          name: "Сахар",
          priceDeltaMinor: 0,
          sortOrder: 0,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "addition-vanilla",
          groupId: "additions",
          name: "Сироп ваниль",
          priceDeltaMinor: 5000,
          sortOrder: 1,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "addition-caramel",
          groupId: "additions",
          name: "Сироп карамель",
          priceDeltaMinor: 5000,
          sortOrder: 2,
          isDefault: false,
          isAvailable: true,
        },
      ],
    },
  ],
  categoryModifierGroupAssignments: [
    { categoryId: "coffee", modifierGroupId: "milk", sortOrder: 0 },
    { categoryId: "coffee", modifierGroupId: "additions", sortOrder: 1 },
  ],
} satisfies CatalogApiResult;

const meta = {
  title: "Admin/Menu/Screen",
  component: MenuPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MenuPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderCatalog(catalog: CatalogApiResult, status: "ready" | "loading") {
  return () => {
    setActivePinia(createPinia());
    const store = useCatalogStore();
    store.$patch({ ...catalog, status });

    return {
      components: { AdminShell, MenuPage },
      setup: () => ({ items: createNavigationItems("administrator") }),
      template:
        '<AdminShell active-section="menu" :items="items" role="administrator"><MenuPage /></AdminShell>',
    };
  };
}

async function expectNoHorizontalOverflow(canvasElement: HTMLElement) {
  const { clientWidth, scrollWidth } =
    canvasElement.ownerDocument.documentElement;

  await expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

export const Default: Story = {
  render: renderCatalog(populatedCatalog, "ready"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: "Меню" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      canvas.getByRole("button", { name: "Кофе 3 товара" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Выпечка 1 товар" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Десерты 1 товар" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Тип молока 3 опции" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Добавки 3 опции" }),
    ).toBeVisible();
    await expect(
      canvas.queryByText("S: 180 ₽ · M: 220 ₽ · L: 260 ₽"),
    ).not.toBeInTheDocument();
    await expectNoHorizontalOverflow(canvasElement);
  },
};

export const Expanded: Story = {
  render: renderCatalog(populatedCatalog, "ready"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "Кофе 3 товара" }),
    );
    await expect(canvas.getByText("Капучино")).toBeVisible();
    await expect(
      canvas.getByText("S: 180 ₽ · M: 220 ₽ · L: 260 ₽"),
    ).toBeVisible();
    await expect(canvas.getByText("Латте")).toBeVisible();
    await expect(
      canvas.getByText("S: 200 ₽ · M: 240 ₽ · L: 280 ₽"),
    ).toBeVisible();
    await expect(canvas.getByText("Эспрессо")).toBeVisible();
    await expect(canvas.getByText("150 ₽")).toBeVisible();
    await expect(canvas.queryByText("Круассан")).not.toBeInTheDocument();
    await expectNoHorizontalOverflow(canvasElement);
  },
};

export const Empty: Story = {
  render: renderCatalog(
    {
      categories: [],
      categoryModifierGroupAssignments: [],
      modifierGroups: [],
      products: [],
    },
    "ready",
  ),
};

export const Loading: Story = {
  render: renderCatalog(populatedCatalog, "loading"),
};

export const Error: Story = {
  render: () => {
    setActivePinia(createPinia());
    const store = useCatalogStore();
    store.$patch({
      error: { message: "Не удалось загрузить меню", requestId: null },
      status: "error",
    });

    return {
      components: { AdminShell, MenuPage },
      setup: () => ({ items: createNavigationItems("administrator") }),
      template:
        '<AdminShell active-section="menu" :items="items" role="administrator"><MenuPage /></AdminShell>',
    };
  },
};

export const Management: Story = {
  render: renderCatalog(populatedCatalog, "ready"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const managementButton = canvas.getByRole("button", {
      name: "Управление меню",
    });
    await expect(managementButton).toBeVisible();
    await userEvent.click(managementButton);
    await expect(
      canvas.getByRole("region", { name: "Управление меню" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "Назначения категорий" }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole("button", { name: /^Кофе$/u }),
    ).toHaveLength(1);
    await expect(
      canvas.getByRole("button", { name: "Новая группа опций" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(canvasElement);
  },
};
