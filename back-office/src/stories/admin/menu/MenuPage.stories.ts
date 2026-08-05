import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { createPinia, setActivePinia } from "pinia";

import MenuPage from "../../../pages/MenuPage.vue";
import { useCatalogStore } from "../../../admin/pages/menu/catalog.store";
import type { CatalogApiResult } from "../../../admin/pages/menu/catalog.types";

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
          priceMinor: 19000,
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
      ],
    },
    {
      id: "espresso",
      categoryId: "coffee",
      type: "OTHER",
      name: "Эспрессо",
      description: "",
      priceMinor: 18000,
      sortOrder: 1,
      isActive: true,
      isAvailable: true,
      variants: [],
    },
    {
      id: "croissant",
      categoryId: "bakery",
      type: "OTHER",
      name: "Круассан",
      description: "С маслом",
      priceMinor: 16000,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      variants: [],
    },
  ],
  modifierGroups: [
    {
      id: "milk",
      name: "Молоко",
      selectionType: "single",
      minSelect: 0,
      maxSelect: 1,
      isActive: true,
      options: [],
    },
  ],
  categoryModifierGroupAssignments: [
    { categoryId: "coffee", modifierGroupId: "milk", sortOrder: 0 },
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

    return { components: { MenuPage }, template: "<MenuPage />" };
  };
}

export const Default: Story = {
  render: renderCatalog(populatedCatalog, "ready"),
};

export const Expanded: Story = {
  render: renderCatalog(populatedCatalog, "ready"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Кофе 2 товаров" });

    await userEvent.click(toggle);
    await expect(canvas.getByText("Капучино")).toBeVisible();
    await expect(canvas.getByText("Эспрессо")).toBeVisible();
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

    return { components: { MenuPage }, template: "<MenuPage />" };
  },
};
