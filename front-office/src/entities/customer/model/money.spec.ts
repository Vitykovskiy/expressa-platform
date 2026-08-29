import { describe, expect, it } from "vitest";
import { formatRubles } from "./money";

describe("formatRubles", () => {
  it("formats rubles consistently", () => {
    expect(formatRubles(300)).toBe("300 ₽");
  });
});
