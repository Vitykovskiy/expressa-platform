import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setMenuStoreDependencies } from "./menu.store.dependencies";
import { useMenuStore } from "./menu.store";

describe("menu store", () => {
  it("throws synchronously when dependencies are not configured", () => {
    setMenuStoreDependencies(undefined as never);
    const store = useMenuStore();
    expect(() => store.load()).toThrow("Зависимости меню не настроены");
  });
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("объединяет одновременные загрузки и сохраняет готовое меню", async () => {
    const resolveMenu = createDeferred();
    const getMenu = vi.fn(() => resolveMenu.promise);
    setMenuStoreDependencies({ publicMenuApi: { getMenu } });
    const store = useMenuStore();

    const firstLoad = store.load();
    const secondLoad = store.load();

    expect(store.status).toBe("loading");
    expect(getMenu).toHaveBeenCalledTimes(1);

    resolveMenu.resolve(menu);
    await Promise.all([firstLoad, secondLoad]);

    expect(store).toMatchObject({
      errorMessage: null,
      menu,
      status: "ready",
    });
  });

  it("не сохраняет устаревшее меню при ошибке и разрешает повтор", async () => {
    const getMenu = vi
      .fn<() => Promise<typeof menu>>()
      .mockRejectedValueOnce(new Error("Сеть недоступна"))
      .mockResolvedValueOnce(menu);
    setMenuStoreDependencies({ publicMenuApi: { getMenu } });
    const store = useMenuStore();
    store.menu = menu;

    await store.load();

    expect(store).toMatchObject({
      errorMessage: "Сеть недоступна",
      menu: null,
      status: "error",
    });

    await store.load();

    expect(store).toMatchObject({
      errorMessage: null,
      menu,
      status: "ready",
    });
    expect(getMenu).toHaveBeenCalledTimes(2);
  });

  it("не выполняет новый запрос после успешной загрузки", async () => {
    const getMenu = vi.fn().mockResolvedValue(menu);
    setMenuStoreDependencies({ publicMenuApi: { getMenu } });
    const store = useMenuStore();

    await store.load();
    await store.load();

    expect(getMenu).toHaveBeenCalledTimes(1);
  });
});

const menu = {
  acceptsNewOrders: true,
  categories: [],
};

function createDeferred() {
  let resolve!: (value: typeof menu) => void;
  const promise = new Promise<typeof menu>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}
