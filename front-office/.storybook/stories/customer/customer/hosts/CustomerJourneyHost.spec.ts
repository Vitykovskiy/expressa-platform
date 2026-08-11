import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CartScreen from "@/features/checkout/CartScreen.vue";
import ProductDetailScreen from "@/features/menu/ProductDetailScreen.vue";
import { vuetify } from "@/app/plugins";
import { createCustomerShellSeed } from "../fixtures/customer.fixtures";
import CustomerJourneyHost from "./CustomerJourneyHost.vue";

describe("CustomerJourneyHost edit", () => {
  it("replaces the configured line instead of adding a duplicate", async () => {
    const seed = createCustomerShellSeed({
      auth: {
        errorMessage: "",
        name: "Клиент",
        phone: "+79990000000",
        step: "success",
        verified: true,
      },
      currentScreen: {
        id: "product",
        groupId: "milk-drinks",
        itemId: "cappuccino",
        editId: "1",
      },
      cartItems: [
        {
          id: "1",
          productId: "cappuccino",
          productName: "Капучино",
          type: "DRINK",
          size: "M",
          sizePrice: 320,
          selectedVariant: {
            id: "cappuccino-m-1",
            size: "M",
            priceMinor: 32000,
          },
          addons: [],
          selectedModifierOptions: [],
          quantity: 1,
          unitTotalMinor: 32000,
          lineTotalMinor: 32000,
          lineTotalRub: 320,
        },
      ],
    });
    const wrapper = mount(CustomerJourneyHost, {
      props: { seed },
      global: { plugins: [vuetify] },
    });
    wrapper.findComponent(ProductDetailScreen).vm.$emit(
      "submit",
      {
        ...seed.cartItems[0]!,
        size: "L",
        sizePrice: 360,
        selectedVariant: { id: "cappuccino-l-2", size: "L", priceMinor: 36000 },
        quantity: 2,
        unitTotalMinor: 44000,
        lineTotalMinor: 88000,
        lineTotalRub: 880,
        addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
        selectedModifierOptions: [
          {
            groupId: "cappuccino-addons",
            id: "oat-milk",
            name: "Овсяное молоко",
            priceDeltaMinor: 8000,
          },
        ],
      },
      "1",
    );
    await wrapper.vm.$nextTick();
    const items = wrapper.findComponent(CartScreen).props("items") as Array<{
      id: string;
      size?: string;
      quantity: number;
      lineTotalMinor: number;
      selectedModifierOptions: Array<{ id: string }>;
    }>;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "1",
      size: "L",
      quantity: 2,
      lineTotalMinor: 88000,
      selectedModifierOptions: [{ id: "oat-milk" }],
    });
  });
});
