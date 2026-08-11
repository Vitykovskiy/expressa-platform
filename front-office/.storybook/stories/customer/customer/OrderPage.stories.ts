import { setup } from "@storybook/vue3-vite";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { expect, within } from "storybook/test";

import { useCheckoutStore } from "@/features/checkout/checkout.store";
import type { Order } from "@/shared/api/orders.api";
import OrderPage from "@/pages/OrderPage.vue";
import {
  orderPageMessages,
  orderPageStageLabels,
} from "@/pages/OrderPage.constants";

const createdOrder: Order = {
  id: "00000000-0000-4000-8000-000000000003",
  items: [
    {
      lineTotalMinor: 112_000,
      modifiers: [
        {
          modifierName: "Овсяное молоко",
          modifierOptionId: "00000000-0000-4000-8000-000000000004",
          priceDeltaMinor: 60,
        },
      ],
      productId: "00000000-0000-4000-8000-000000000001",
      productName: "Капучино",
      quantity: 2,
      size: "M",
      unitTotalMinor: 56_000,
      variantId: "00000000-0000-4000-8000-000000000002",
    },
  ],
  number: "1042",
  stage: "CREATED",
  totalMinor: 112_000,
};

const longContentOrder: Order = {
  ...createdOrder,
  items: [
    {
      ...createdOrder.items[0]!,
      modifiers: [
        {
          ...createdOrder.items[0]!.modifiers[0]!,
          modifierName:
            "Оченьдлиннаянеразрывнаянастройканапиткадляпроверкипереносастрокивкарточкезаказа",
        },
      ],
      productName:
        "Оченьдлинноенеразрывноеназваниенапиткадляпроверкипереносастрокивкарточкезаказа",
    },
  ],
};

setup(async (app, storyContext) => {
  if (
    storyContext === undefined ||
    !storyContext.id.startsWith("customer-screens-orderpage--")
  ) {
    return;
  }

  const order = storyContext.id.endsWith("--unavailable")
    ? null
    : storyContext.id.endsWith("--long-content")
      ? longContentOrder
      : createdOrder;
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: OrderPage, path: "/orders/:id" }],
  });

  app.use(pinia);
  app.use(router);
  useCheckoutStore(pinia).order = order;
  await router.push(`/orders/${order?.id ?? "missing"}`);
  await router.isReady();
});

const meta = {
  title: "Customer/Screens/OrderPage",
  component: OrderPage,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof OrderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Created: Story = {
  render: () => ({ components: { OrderPage }, template: "<OrderPage />" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvasElement.querySelector(".order-page__items li");
    const lineTotal = canvasElement.querySelector(".order-page__line-total");
    const total = canvas.getByText("Итого").parentElement;

    if (!item || !lineTotal || !total)
      throw new Error("Order item details are required");

    await expect(canvas.getByText(orderPageStageLabels.CREATED)).toBeVisible();
    await expect(canvas.getByText("Капучино")).toBeVisible();
    await expect(canvas.getByText(/2 × 560/u)).toBeVisible();
    await expect(canvas.getByText("Размер M")).toBeVisible();
    await expect(canvas.getByText("+ Овсяное молоко")).toBeVisible();
    await expect(lineTotal).toHaveTextContent(/1\s*120/u);
    await expect(total).toHaveTextContent(/1\s*120/u);
    await expect(getComputedStyle(item).color).not.toBe(
      getComputedStyle(item).backgroundColor,
    );
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(canvasElement.ownerDocument.defaultView!.innerWidth);
  },
};

export const Unavailable: Story = {
  render: () => ({ components: { OrderPage }, template: "<OrderPage />" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(orderPageMessages.unavailable)).toBeVisible();
    await expect(
      canvas.queryByRole("list", { name: "Состав заказа" }),
    ).toBeNull();
  },
};

export const LongContent: Story = {
  render: () => ({ components: { OrderPage }, template: "<OrderPage />" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvasElement.querySelector(".order-page__items li");
    const lineTotal = canvasElement.querySelector(".order-page__line-total");
    const product = longContentOrder.items[0]!.productName;
    const modifier = `+ ${longContentOrder.items[0]!.modifiers[0]!.modifierName}`;

    if (!item || !lineTotal) throw new Error("Long order details are required");

    await expect(canvas.getByText(product)).toBeVisible();
    await expect(canvas.getByText(modifier)).toBeVisible();
    await expect(lineTotal).toBeVisible();
    await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(canvasElement.ownerDocument.defaultView!.innerWidth);
  },
};
