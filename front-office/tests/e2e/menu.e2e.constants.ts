import { frontOfficeBackendReadyUrl } from "../../playwright.config.constants";

export const customerBreakpointWidths = [479, 480, 767, 768, 1023, 1024];
export const menuFlowViewportWidths = [320, 390, 768, 1280];
export const menuViewportHeight = 844;
// Only this exact anonymous bootstrap endpoint and status may produce Chromium's generic resource error.
// Pathname comparison deliberately accepts the configured API origin and ignores query parameters.
export const expectedUnauthenticatedRefreshPath = "/api/v2/auth/refresh";
export const expectedUnauthenticatedRefreshOrigin = new URL(
  frontOfficeBackendReadyUrl,
).origin;
export const expectedUnauthenticatedRefreshStatus = 401;
export const expectedUnauthenticatedRefreshConsoleError =
  "Failed to load resource: the server responded with a status of 401 (Unauthorized)";
export const productNames = {
  cappuccino: "Капучино",
  croissant: "Круассан",
  espresso: "Эспрессо",
  unpublished: "Тестовый напиток",
} as const;
export const configuredProductPrices = {
  cappuccino: "440 ₽",
  croissant: "440 ₽",
  espresso: "280 ₽",
} as const;
export const cartSummaries = {
  afterCappuccino: "1 · 440 ₽",
  afterCroissant: "4 · 1 160 ₽",
  afterEspresso: "2 · 720 ₽",
} as const;
export const screenNames = {
  bakery: "Выпечка",
  coffee: "Кофе",
  menu: "Что будем заказывать?",
} as const;
