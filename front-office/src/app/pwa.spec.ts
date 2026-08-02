import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { registerSW } = vi.hoisted(() => ({ registerSW: vi.fn() }));

vi.mock("virtual:pwa-register", () => ({ registerSW }));

import { registerPwa } from "./pwa";

describe("registerPwa", () => {
  beforeEach(() => {
    registerSW.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("регистрирует service worker в production", () => {
    vi.stubEnv("PROD", true);

    registerPwa();

    expect(registerSW).toHaveBeenCalledWith({ immediate: true });
  });

  it("не регистрирует service worker вне production", () => {
    vi.stubEnv("PROD", false);

    registerPwa();

    expect(registerSW).not.toHaveBeenCalled();
  });
});
