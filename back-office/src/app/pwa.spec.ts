/// <reference types="node" />

import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { registerSW } = vi.hoisted(() => ({ registerSW: vi.fn() }));

vi.mock("virtual:pwa-register", () => ({ registerSW }));

import { registerPwa } from "./pwa";

function expectPngIcon(name: string, size: number): void {
  const image = readFileSync(`public/${name}`);

  expect(image.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  expect(image.readUInt32BE(16)).toBe(size);
  expect(image.readUInt32BE(20)).toBe(size);
}

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

  it("содержит PNG-иконки с заявленными размерами", () => {
    expectPngIcon("icon-192.png", 192);
    expectPngIcon("icon-512.png", 512);
  });
});
