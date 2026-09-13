import { describe, expect, it } from "vitest";

import { getSafeAuthReturnTo } from "./auth-return";

describe("getSafeAuthReturnTo", () => {
  it.each([
    "https://evil.example/orders",
    "//evil.example/orders",
    "/%2f%2fevil.example/orders",
    "/%5cevil.example/orders",
    "/\\evil.example/orders",
    "/auth/phone",
    "/AUTH/PHONE",
    "/Auth/Code",
    "/auth/phone/",
    "/auth%2fcode",
    "/auth/code?returnTo=%2Forders",
  ])("rejects hostile or auth-loop target %s", (value) => {
    expect(getSafeAuthReturnTo(value)).toBeUndefined();
  });

  it("preserves a valid internal path, query and hash", () => {
    expect(getSafeAuthReturnTo("/orders?filter=active#current")).toBe(
      "/orders?filter=active#current",
    );
  });
});
