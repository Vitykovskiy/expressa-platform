import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import OrderCard from "./OrderCard.vue";

describe("OrderCard", () => {
  it.each(["CREATED", "ACCEPTED", "PREPARING", "ISSUED"] as const)(
    "does not render a duplicate status cue for %s",
    (stage) => {
      const wrapper = mountCard(stage);

      expect(wrapper.find(".order-card__pickup-cue").exists()).toBe(false);
    },
  );

  it("shows the unique pickup cue for READY before the expanded composition", async () => {
    const wrapper = mountCard("READY");

    expect(wrapper.get(".order-card__pickup-cue").text()).toBe(
      "Заберите заказ на кассе.",
    );
    await wrapper.get(".order-card__header").trigger("click");
    expect(
      wrapper
        .find(".order-card__pickup-cue")
        .element.compareDocumentPosition(
          wrapper.get(".order-card__details").element,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

function mountCard(
  stage: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED",
) {
  return mount(OrderCard, {
    props: {
      order: {
        createdAt: "2026-09-10T12:00:00.000Z",
        id: "00000000-0000-4000-8000-000000000001",
        items: [],
        number: "20260910-001",
        stage,
        total: 320,
      },
      stageLabel: "Статус",
    },
    global: { stubs: { UiBtn: { template: "<button><slot /></button>" } } },
  });
}
