import { describe, expect, it } from "vitest";
import { formatMinorAmount } from "./money";

describe("formatMinorAmount", () => {
  it("formats rubles and kopecks consistently", () => {
    expect(formatMinorAmount(30050)).toBe("300,5 ₽");
  });
});
