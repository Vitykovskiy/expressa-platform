import { describe, expect, it } from "vitest";

import type { CartScreenProps } from "./CartScreen.types";

describe("CartScreenProps", () => {
  it("требует новый итог для повторного подтверждения", () => {
    const validProps: CartScreenProps = {
      checkoutState: "reconfirmation-required",
      items: [],
      reconfirmedTotalRub: 720,
    };

    // @ts-expect-error повторное подтверждение без нового итога запрещено
    const invalidProps: CartScreenProps = {
      checkoutState: "reconfirmation-required",
      items: [],
    };

    expect(validProps.reconfirmedTotalRub).toBe(720);
    expect(invalidProps.checkoutState).toBe("reconfirmation-required");
  });
});
