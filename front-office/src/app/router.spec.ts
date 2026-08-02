import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import { router } from "./router";

describe("маршруты front-office", () => {
  it.each([
    ["/", "Меню"],
    ["/cart", "Корзина"],
    ["/auth/phone", "Вход по телефону"],
    ["/auth/code", "Подтверждение кода"],
    ["/orders/8a0c5df9-a520-4d94-8912-eba5350cf4dc", "Заказ"],
    ["/orders", "История заказов"],
  ])("открывает %s", async (path, title) => {
    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: router.options.routes,
    });

    await testRouter.push(path);
    await testRouter.isReady();

    expect(
      testRouter.currentRoute.value.matched[0]?.components?.default,
    ).toBeDefined();
    expect(testRouter.currentRoute.value.matched[0]?.meta.title ?? title).toBe(
      title,
    );
  });
});
