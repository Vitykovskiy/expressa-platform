import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { apiClientKey, createApiClient } from "../shared/api/client";
import AvailabilityPage from "./AvailabilityPage.vue";

vi.mock("../app/session.store", () => ({
  useSessionStore: () => ({
    accessToken: "example-token",
    readWithRecovery: (read: (accessToken: string) => Promise<unknown>) =>
      read("example-token"),
  }),
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const choiceId = "33333333-3333-4333-8333-333333333333";
const modifierGroupId = "44444444-4444-4444-8444-444444444444";
const modifierId = "55555555-5555-4555-8555-555555555555";

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function legacyAvailability() {
  return {
    categories: [
      { id: categoryId, isActive: true, name: "Кофе", sortOrder: 0 },
    ],
    categoryModifierGroups: [
      { categoryId, groupId: modifierGroupId, sortOrder: 0 },
    ],
    intake: {
      acceptsNewOrders: true,
      updatedAt: null,
      updatedBy: null,
      updatedByLabel: null,
    },
    modifierGroups: [{ id: modifierGroupId, isActive: true, name: "Молоко" }],
    modifierOptions: [
      {
        groupId: modifierGroupId,
        id: modifierId,
        isAvailable: true,
        name: "Овсяное",
        sortOrder: 0,
      },
    ],
    productVariants: [],
    products: [
      {
        categoryId,
        id: productId,
        isActive: true,
        isAvailable: true,
        name: "Капучино",
        sortOrder: 0,
      },
    ],
  };
}

function catalogV3(choiceAvailable = true) {
  return {
    categories: legacyAvailability().categories,
    products: [
      {
        id: productId,
        categoryId,
        isActive: true,
        isAvailable: true,
        name: "Капучино",
        sortOrder: 0,
        priceChoices: [
          {
            id: choiceId,
            portionLabel: "250 мл",
            price: 250,
            sortOrder: 0,
            isAvailable: choiceAvailable,
          },
        ],
      },
    ],
  };
}

function mountPage(fetcher: typeof fetch) {
  return mount(AvailabilityPage, {
    global: {
      provide: {
        [apiClientKey as symbol]: createApiClient(
          "https://api.example.test/api/v2",
          fetcher,
        ),
      },
    },
  });
}

describe("AvailabilityPage", () => {
  it("shows v3 catalog price choices with their saved portion labels", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) =>
      response(
        url.toString().includes("/api/v3/backoffice/catalog")
          ? catalogV3()
          : legacyAvailability(),
      ),
    );
    const wrapper = mountPage(fetcher);
    await flushPromises();
    const groups = wrapper
      .getComponent({ name: "AvailabilityScreen" })
      .props("groups") as {
      items: { id: string; label: string; sublabel: string; type: string }[];
    }[];
    expect(groups[0]?.items).toContainEqual({
      id: choiceId,
      label: "Капучино · 250 мл",
      sublabel: "Порция",
      type: "priceChoice",
      isAvailable: true,
    });
  });

  it("updates only the selected price choice through v3 availability", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url, request) => {
      if ((request as RequestInit).method === "PATCH")
        return response({
          id: choiceId,
          type: "price_choice",
          isAvailable: false,
        });
      return response(
        url.toString().includes("/api/v3/backoffice/catalog")
          ? catalogV3()
          : legacyAvailability(),
      );
    });
    const wrapper = mountPage(fetcher);
    await flushPromises();
    const screen = wrapper.getComponent({ name: "AvailabilityScreen" });
    screen.vm.$emit(
      "availability-change",
      {
        id: choiceId,
        label: "Капучино · 250 мл",
        sublabel: "Порция",
        type: "priceChoice",
        isAvailable: true,
      },
      false,
    );
    await flushPromises();
    expect(
      fetcher.mock.calls.some(
        ([url, request]) =>
          url
            .toString()
            .includes(
              `/api/v3/backoffice/availability/price-choice/${choiceId}`,
            ) && (request as RequestInit).method === "PATCH",
      ),
    ).toBe(true);
  });
});
