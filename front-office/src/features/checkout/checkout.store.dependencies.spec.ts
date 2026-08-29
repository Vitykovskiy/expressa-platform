import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "@/shared/api/client";
import {
  configureCheckoutStoreDependencies,
  getCheckoutStoreDependencies,
} from "./checkout.store.dependencies";

describe("зависимости checkout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("использует randomUUID, когда браузер его предоставляет", () => {
    const randomUUID = vi.fn<() => string>().mockReturnValue("random-uuid");
    const getRandomValues = vi.fn();
    vi.stubGlobal("crypto", { getRandomValues, randomUUID });

    configureCheckoutStoreDependencies(createApiClient("/"));

    expect(getCheckoutStoreDependencies().createIdempotencyKey()).toBe(
      "random-uuid",
    );
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("создаёт RFC 4122 UUIDv4 через getRandomValues без randomUUID", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.set(Array.from({ length: 16 }, (_, index) => index));
      return bytes;
    });
    vi.stubGlobal("crypto", { getRandomValues });

    configureCheckoutStoreDependencies(createApiClient("/"));

    const key = getCheckoutStoreDependencies().createIdempotencyKey();

    expect(key).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
  });
});
