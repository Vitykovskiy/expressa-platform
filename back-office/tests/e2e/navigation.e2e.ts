import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

const reference = JSON.parse(
  readFileSync(new URL("./reference-index.json", import.meta.url), "utf8"),
) as { entries: Record<string, { id: string; type: string }> };
const storyIds = Object.values(reference.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);
const storyPath = (storyId: string) =>
  `/iframe.html?id=${storyId}&viewMode=story`;

const waitForReferenceStory = async (page: Page) => {
  const rootContent = page.locator("#storybook-root > *").first();
  const dialogs = page.locator('body [role="dialog"]:visible');

  await expect
    .poll(async () => {
      const [rootContentVisible, dialogVisible] = await Promise.all([
        rootContent.isVisible(),
        dialogs.count().then((count) => count > 0),
      ]);

      return rootContentVisible || dialogVisible;
    })
    .toBe(true);
};

test.describe.configure({ mode: "parallel" });

for (const storyId of storyIds) {
  test(`reference story завершается: ${storyId}`, async ({ page }) => {
    await page.goto(storyPath(storyId));
    await waitForReferenceStory(page);

    await expect
      .poll(() =>
        page.evaluate(() => {
          const storybook = globalThis as typeof globalThis & {
            __STORYBOOK_PREVIEW__?: {
              currentRender?: { phase?: string };
            };
          };

          return storybook.__STORYBOOK_PREVIEW__?.currentRender?.phase;
        }),
      )
      .toBe("finished");
    await expect(page.locator("#error-message")).toBeEmpty();

    if (storyId === "admin-orders-screen--reject-dialog-visual") {
      const dialog = page.getByRole("dialog", { name: "Отклонить заказ" });

      await expect(
        dialog.getByText("Отклонить заказ", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("textbox", { name: "Причина" }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Отклонить", exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Отмена", exact: true }),
      ).toBeVisible();
    }
  });
}

for (const width of [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
  for (const storyId of [
    "admin-orders-screen--all-statuses",
    "admin-availability-availabilityscreen--default",
    "admin-menu-parts--expanded-option-group",
    "admin-users-usersscreen--flow",
  ]) {
    test(`${storyId} сохраняет ширину ${width}px`, async ({ page }) => {
      await page.setViewportSize({ height: 900, width });
      await page.goto(storyPath(storyId));
      await page.locator("#storybook-root").waitFor();

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    });
  }
}

test("OTP visual показывает состояние невалидного кода", async ({ page }) => {
  await page.goto(storyPath("admin-auth-authscreen--otp-validation-visual"));
  await page.locator("#storybook-root").waitFor();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const storybook = globalThis as typeof globalThis & {
          __STORYBOOK_PREVIEW__?: {
            currentRender?: { phase?: string };
          };
        };

        return storybook.__STORYBOOK_PREVIEW__?.currentRender?.phase;
      }),
    )
    .toBe("finished");

  const otp = page.getByLabel("Код из сообщения");
  await expect(page.locator(".auth-screen > .auth-screen__card")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Введите код из сообщения" }),
  ).toBeVisible();
  await expect(otp).toHaveValue("9999");
  await expect(otp).toHaveAttribute("aria-invalid", "true");
  await expect(otp).toHaveAttribute("aria-describedby", "auth-otp-error");
  await expect(page.getByRole("alert")).toHaveText("Код неверный или истёк");
});

const authScreenStates = [
  {
    stateSelector: ".auth-screen__card",
    storyId: "admin-auth-authscreen--phone-validation",
  },
  {
    stateSelector: ".auth-screen__card",
    storyId: "admin-auth-authscreen--otp-validation",
  },
  {
    stateSelector: ".auth-screen__card",
    storyId: "admin-auth-authscreen--denied",
  },
  {
    stateSelector: ".auth-screen__success",
    storyId: "admin-auth-authscreen--success",
  },
] as const;

test("auth-экран занимает viewport без горизонтальной прокрутки", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const height = 900;

  for (const width of [320, 767, 768, 1280]) {
    for (const { stateSelector, storyId } of authScreenStates) {
      await page.setViewportSize({ height, width });
      await page.goto(storyPath(storyId));
      await page.locator("#storybook-root").waitFor();

      await expect
        .poll(() =>
          page.evaluate(() => {
            const storybook = globalThis as typeof globalThis & {
              __STORYBOOK_PREVIEW__?: {
                currentRender?: { phase?: string };
              };
            };

            return storybook.__STORYBOOK_PREVIEW__?.currentRender?.phase;
          }),
        )
        .toBe("finished");
      await page.evaluate(() => globalThis.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => globalThis.scrollY)).toBe(0);

      const screen = page.locator(".auth-screen");
      const state = page.locator(stateSelector);
      await expect(state).toBeVisible();

      const [screenGeometry, stateGeometry] = await Promise.all([
        screen.evaluate((element) => {
          const { height, top } = element.getBoundingClientRect();

          return {
            height,
            scrollWidth: document.documentElement.scrollWidth,
            top,
          };
        }),
        state.evaluate((element) => {
          const { bottom, top } = element.getBoundingClientRect();

          return { bottom, top };
        }),
      ]);

      expect(screenGeometry.top).toBe(0);
      expect(screenGeometry.height).toBeGreaterThanOrEqual(height);
      expect(screenGeometry.scrollWidth).toBeLessThanOrEqual(width);
      expect(stateGeometry.top).toBeGreaterThanOrEqual(0);
      expect(stateGeometry.bottom).toBeLessThanOrEqual(height);
    }
  }
});

test("UIQL-I1-BO: admin tab bar сохраняет заданную геометрию", async ({
  page,
}) => {
  const storyId = "admin-shell--administrator";
  const labels = ["Очередь", "Доступность", "Меню"];

  for (const [width, expectedRows] of [
    [320, [2, 1]],
    [390, [2, 1]],
    [479, [2, 1]],
    [480, [2, 1]],
    [767, [2, 1]],
  ] as const) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(storyPath(storyId));
    await page.locator("#storybook-root").waitFor();

    const geometry = await page.locator(".tab-bar").evaluate((tabBar) => {
      const tabBarRect = tabBar.getBoundingClientRect();
      const buttons = [...tabBar.querySelectorAll("button")].map((button) => {
        const { height, left, right, top, width } =
          button.getBoundingClientRect();

        return {
          backgroundColor: getComputedStyle(button).backgroundColor,
          borderTopWidth: getComputedStyle(button).borderTopWidth,
          height,
          label: button.textContent?.trim(),
          left,
          right,
          top,
          width,
          whiteSpace: getComputedStyle(button).whiteSpace,
          fits: button.scrollWidth <= button.clientWidth,
        };
      });
      const content = document.querySelector(".admin-shell-content");
      const shell = document.querySelector(".admin-shell");
      const contentRect = content?.getBoundingClientRect();
      const shellRect = shell?.getBoundingClientRect();
      const rows = [...new Set(buttons.map((button) => button.top))].map(
        (top) => buttons.filter((button) => button.top === top).length,
      );

      return {
        activeButton: buttons.find((button) => button.label === "Очередь"),
        activeSurface: (() => {
          const reference = document.createElement("div");
          reference.style.background = getComputedStyle(
            document.documentElement,
          ).getPropertyValue("--expressa-color-control-selected-surface");
          document.body.append(reference);
          const background = getComputedStyle(reference).backgroundColor;
          reference.remove();

          return background;
        })(),
        buttons,
        contentBottom: contentRect?.bottom ?? 0,
        contentReachable: content
          ? content.scrollHeight >= content.clientHeight
          : false,
        rows,
        shellBottom: shellRect?.bottom ?? 0,
        scrollWidth: document.documentElement.scrollWidth,
        tabBarBottom: tabBarRect.bottom,
        tabBarHeight: tabBarRect.height,
        tabBarTop: tabBarRect.top,
        withinBounds: buttons.every(
          (button) =>
            button.left >= tabBarRect.left && button.right <= tabBarRect.right,
        ),
      };
    });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
    expect(geometry.buttons.map((button) => button.label)).toEqual(labels);
    expect(geometry.buttons).toHaveLength(labels.length);
    expect(
      geometry.buttons.every(
        (button) => button.width > 0 && button.height >= 44,
      ),
    ).toBe(true);
    expect(geometry.rows).toEqual(expectedRows);
    expect(geometry.withinBounds).toBe(true);
    expect(geometry.activeButton?.backgroundColor).toBe(geometry.activeSurface);
    expect(geometry.activeButton?.borderTopWidth).toBe("0px");
    expect(
      geometry.buttons.every((button) => button.whiteSpace === "nowrap"),
    ).toBe(true);
    expect(geometry.buttons.every((button) => button.fits)).toBe(true);
    expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.tabBarTop);
    expect(geometry.tabBarBottom).toBe(geometry.shellBottom);
    expect(geometry.contentReachable).toBe(true);
  }

  await page.setViewportSize({ height: 900, width: 768 });
  await page.goto(storyPath(storyId));
  await page.locator("#storybook-root").waitFor();
  await expect(page.locator(".tab-bar")).toBeHidden();
  await expect(page.locator(".admin-shell-content")).toHaveCSS(
    "padding-bottom",
    "0px",
  );
  const desktopGeometry = await page
    .locator(".admin-shell")
    .evaluate((shell) => {
      const content = shell.querySelector(".admin-shell-content");

      return {
        contentHeight: content?.getBoundingClientRect().height ?? 0,
        shellHeight: shell.getBoundingClientRect().height,
      };
    });
  expect(desktopGeometry.contentHeight).toBe(desktopGeometry.shellHeight);
});

test("UIQL-I1-BO: заказы меняют число колонок на 1024px", async ({ page }) => {
  for (const [width, expectedColumns] of [
    [320, 1],
    [390, 1],
    [479, 1],
    [480, 1],
    [767, 1],
    [768, 1],
    [1023, 1],
    [1024, 2],
    [1280, 2],
  ] as const) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(storyPath("admin-orders-screen--all-statuses"));
    await page.locator("#storybook-root").waitFor();

    const columns = await page
      .locator(".orders-screen__grid")
      .evaluate(
        (grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      );

    expect(columns).toBe(expectedColumns);
  }
});

test("UIQL-I1-BO: barista tab bar остаётся в одну строку", async ({ page }) => {
  const storyId = "admin-shell--barista";

  for (const width of [320, 390, 479, 480, 767]) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(storyPath(storyId));
    await page.locator("#storybook-root").waitFor();

    const geometry = await page.locator(".tab-bar").evaluate((tabBar) => {
      const tabBarRect = tabBar.getBoundingClientRect();
      const buttons = [...tabBar.querySelectorAll("button")].map((button) =>
        button.getBoundingClientRect(),
      );

      return {
        buttonCount: buttons.length,
        contentBottom: document
          .querySelector(".admin-shell-content")
          ?.getBoundingClientRect().bottom,
        rowCount: new Set(buttons.map((button) => button.top)).size,
        shellBottom: document
          .querySelector(".admin-shell")
          ?.getBoundingClientRect().bottom,
        scrollWidth: document.documentElement.scrollWidth,
        tabBarBottom: tabBarRect.bottom,
        tabBarTop: tabBarRect.top,
        withinBounds: buttons.every(
          (button) =>
            button.left >= tabBarRect.left && button.right <= tabBarRect.right,
        ),
      };
    });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
    expect(geometry.buttonCount).toBe(2);
    expect(geometry.rowCount).toBe(1);
    expect(geometry.withinBounds).toBe(true);
    expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.tabBarTop);
    expect(geometry.tabBarBottom).toBe(geometry.shellBottom);
  }

  await page.setViewportSize({ height: 900, width: 768 });
  await page.goto(storyPath(storyId));
  await page.locator("#storybook-root").waitFor();
  await expect(page.locator(".tab-bar")).toBeHidden();
});
