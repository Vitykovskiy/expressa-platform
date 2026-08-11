import { setup } from "@storybook/vue3-vite";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";

import { useCheckoutStore } from "@/features/checkout/checkout.store";
import type { Order } from "@/shared/api/orders.api";
import OrderPage from "@/pages/OrderPage.vue";

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
};

export const Unavailable: Story = {
  render: () => ({ components: { OrderPage }, template: "<OrderPage />" }),
};

export const LongContent: Story = {
  render: () => ({ components: { OrderPage }, template: "<OrderPage />" }),
};
