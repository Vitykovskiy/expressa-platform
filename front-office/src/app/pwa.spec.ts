import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

const { registerSW, updateServiceWorker } = vi.hoisted(() => ({
  registerSW: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock("virtual:pwa-register", () => ({ registerSW }));

import { registerPwa } from "./pwa";

describe("registerPwa", () => {
  const getEntriesByType = vi.spyOn(performance, "getEntriesByType");
  let onNeedRefresh: (() => void) | undefined;

  beforeEach(() => {
    registerSW.mockReset();
    updateServiceWorker.mockReset();
    onNeedRefresh = undefined;
    registerSW.mockImplementation((options: RegisterSWOptions = {}) => {
      onNeedRefresh = options.onNeedRefresh;
      return updateServiceWorker;
    });
    getEntriesByType.mockReturnValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("регистрирует service worker without activating an update on ordinary navigation", () => {
    vi.stubEnv("PROD", true);
    getEntriesByType.mockReturnValue([
      { type: "navigate" } as PerformanceNavigationTiming,
    ]);

    registerPwa();

    expect(registerSW).toHaveBeenCalledWith({
      immediate: true,
      onNeedRefresh: expect.any(Function),
    });
    expect(onNeedRefresh).toBeTypeOf("function");
    onNeedRefresh?.();
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it("activates a waiting update after an explicit page reload", () => {
    vi.stubEnv("PROD", true);
    getEntriesByType.mockReturnValue([
      { type: "reload" } as PerformanceNavigationTiming,
    ]);

    registerPwa();

    expect(registerSW).toHaveBeenCalledWith({
      immediate: true,
      onNeedRefresh: expect.any(Function),
    });
    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(onNeedRefresh).toBeTypeOf("function");
    onNeedRefresh?.();
    expect(updateServiceWorker).toHaveBeenCalledOnce();
  });

  it("не регистрирует service worker вне production", () => {
    vi.stubEnv("PROD", false);

    registerPwa();

    expect(registerSW).not.toHaveBeenCalled();
  });
});
