import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { openStory } from "./storybook-test-utils.mjs";

const reference = JSON.parse(
  readFileSync(new URL("./reference-index.json", import.meta.url), "utf8"),
);
const storyIds = Object.values(reference.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);

test.describe.configure({ mode: "parallel" });

for (const storyId of storyIds) {
  test(`reference story завершается: ${storyId}`, async ({ page }) => {
    await openStory(page, storyId);

    await expect
      .poll(() =>
        page.evaluate(
          () => globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase,
        ),
      )
      .toBe("finished");
    await expect(page.locator("#error-message")).toBeEmpty();
  });
}

test("responsive screens сохраняют ширину reference", async ({ page }) => {
  const responsiveStories = [
    "customer-screens-menuroot--default",
    "customer-screens-productdetail--default",
    "customer-screens-ordershistory--populated",
  ];

  for (const storyId of responsiveStories) {
    for (const width of [390, 479, 480, 767, 768, 1023, 1024, 1280, 1440]) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  }
});

test("Auth: label, focus, inline error и loading сохраняют доступные состояния", async ({
  page,
}) => {
  await openStory(page, "customer-screens-auth--phone");

  const phone = page.getByRole("textbox", { name: "Номер телефона" });
  const label = page.locator("label.auth-form__field-label");

  await expect(label).toHaveAttribute("for", "auth-phone");
  await expect(phone).toHaveAttribute("id", "auth-phone");
  await expect(phone).toHaveAttribute("placeholder", "+7 (___) ___-__-__");
  await phone.focus();
  await expect(phone).toBeFocused();

  await openStory(page, "customer-screens-auth--otp-error");
  const inlineError = page.locator(".auth-form .ui-field-message");

  await expect(inlineError).toHaveAttribute("role", "alert");
  await expect(inlineError).toContainText("Код неверный или истёк");

  await openStory(page, "customer-screens-auth--register");
  const name = page.getByRole("textbox", { name: "Ваше имя" });
  const nameLabel = page.locator("label.auth-form__field-label");

  await expect(nameLabel).toHaveAttribute("for", "auth-name");
  await expect(name).toHaveAttribute("id", "auth-name");

  await openStory(page, "customer-screens-auth--loading");
  await expect(page.locator(".auth-screen")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  await expect(page.getByRole("status")).toBeVisible();
});

test("Storybook host повторяет экранную геометрию customer screens", async ({
  page,
}) => {
  const widths = [320, 390, 479, 480, 767, 768, 1023, 1024];
  const cases = [
    {
      empty: true,
      header: ".orders-history__header",
      root: ".orders-history",
      storyId: "customer-screens-ordershistory--empty",
    },
    {
      header: ".orders-history__header",
      root: ".orders-history",
      storyId: "customer-screens-ordershistory--preparing",
    },
    {
      header: ".orders-history__header",
      root: ".orders-history",
      storyId: "customer-screens-ordershistory--completed",
    },
    {
      footer: ".product-detail__footer",
      header: ".product-detail__header",
      root: ".product-detail",
      storyId: "customer-screens-productdetail--long",
    },
  ];

  for (const width of widths) {
    for (const { empty, footer, header, root, storyId } of cases) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);
      await expect
        .poll(() =>
          page.evaluate(
            () => globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase,
          ),
        )
        .toBe("finished");
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo(0, 0);
      });
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.locator(root).waitFor();

      const initialGeometry = await page.evaluate(
        ({ empty, header, root }) => {
          const host = document.querySelector("#storybook-root");
          const rootElement = document.querySelector(root);
          const headerElement = document.querySelector(header);

          if (!host || !rootElement || !headerElement)
            throw new Error("Story screen regions are required");

          const rootRect = rootElement.getBoundingClientRect();
          const headerRect = headerElement.getBoundingClientRect();

          return {
            emptyFillsHost: !empty || rootRect.height >= host.clientHeight,
            headerInViewport:
              headerRect.top >= 0 && headerRect.bottom <= window.innerHeight,
            rootTopInViewport:
              rootRect.top >= 0 && rootRect.top < window.innerHeight,
            widthsFit:
              rootRect.width <= window.innerWidth &&
              headerRect.width <= window.innerWidth,
          };
        },
        { empty, header, root },
      );

      expect(initialGeometry.rootTopInViewport).toBe(true);
      expect(initialGeometry.headerInViewport).toBe(true);
      expect(initialGeometry.widthsFit).toBe(true);
      expect(initialGeometry.emptyFillsHost).toBe(true);

      if (footer) {
        await page.locator(footer).scrollIntoViewIfNeeded();

        const footerInViewport = await page
          .locator(footer)
          .evaluate((element) => {
            const rect = element.getBoundingClientRect();

            return rect.top >= 0 && rect.bottom <= window.innerHeight;
          });

        expect(footerInViewport).toBe(true);
      }
    }
  }
});

test("I1-FO: menu, cart и orders сохраняют геометрию на границах", async ({
  page,
}) => {
  const widths = [320, 390, 479, 480, 767, 768, 1023, 1024, 1280, 1440];
  const cases = [
    {
      check: "menu",
      root: ".menu-root",
      storyId: "customer-screens-menuroot--default",
    },
    {
      check: "menu-long",
      root: ".menu-root",
      storyId: "customer-screens-menuroot--long",
    },
    {
      check: "cart-empty",
      root: ".cart-screen",
      storyId: "customer-screens-cart--empty",
    },
    {
      check: "root",
      root: ".cart-screen",
      storyId: "customer-screens-cart--long",
    },
    {
      check: "orders",
      root: ".orders-history",
      storyId: "customer-screens-ordershistory--populated",
    },
    {
      check: "root",
      root: ".orders-history",
      storyId: "customer-screens-ordershistory--long",
    },
  ];

  for (const width of widths) {
    for (const { check, root, storyId } of cases) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);
      await page.locator(root).waitFor();

      const geometry = await page.locator(root).evaluate((element, check) => {
        const rect = element.getBoundingClientRect();
        const cards = [...element.querySelectorAll(".menu-root__card")];
        const menuFits = cards.every((card) => {
          const cardRect = card.getBoundingClientRect();
          const content = card.querySelector(".menu-root__content");
          const arrow = card.querySelector(".menu-root__arrow");

          if (!content || !arrow) return false;

          const contentRect = content.getBoundingClientRect();
          const arrowRect = arrow.getBoundingClientRect();

          return (
            content.scrollWidth <= content.clientWidth &&
            arrowRect.right <= cardRect.right &&
            arrowRect.left >= contentRect.right
          );
        });
        const longContent = element.querySelector(".menu-root__content");
        const action = element.querySelector(".cart-screen__empty .ui-btn");
        const actionRect = action?.getBoundingClientRect();
        const ordersList = element.querySelector(".orders-history__list");
        const ordersFit = [...element.querySelectorAll(".order-card")].every(
          (card) => {
            const summary = card.querySelector(".order-card__summary");
            const content = card.querySelector(".order-card__summary-content");
            const action = card.querySelector(".order-card__summary-action");

            if (!summary || !content || !action) return false;

            const summaryRect = summary.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            const actionRect = action.getBoundingClientRect();

            return (
              content.scrollWidth <= content.clientWidth &&
              actionRect.left >= contentRect.right &&
              actionRect.top >= summaryRect.top &&
              actionRect.bottom <= summaryRect.bottom
            );
          },
        );
        const orderColumns = ordersList
          ? getComputedStyle(ordersList).gridTemplateColumns.split(" ").length
          : 0;
        const verified =
          check === "menu"
            ? menuFits
            : check === "menu-long"
              ? menuFits &&
                (longContent?.getBoundingClientRect().height ?? 0) > 24
              : check === "cart-empty"
                ? Boolean(
                    actionRect &&
                    actionRect.width <= window.innerWidth &&
                    actionRect.height >= 44,
                  )
                : check === "orders"
                  ? ordersFit &&
                    orderColumns === (window.innerWidth >= 768 ? 2 : 1)
                  : element.scrollWidth <= element.clientWidth;

        return {
          insideViewport: rect.left >= 0 && rect.right <= window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          verified,
        };
      }, check);

      expect(geometry.insideViewport).toBe(true);
      expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
      expect(geometry.verified).toBe(true);
    }
  }
});

test("CustomerShell занимает viewport без Storybook-артборда", async ({
  page,
}) => {
  const storyId =
    "customer-journeys-customershell--authenticated-navigation-stack";

  for (const width of [390, 479, 480, 767, 768, 1023, 1024]) {
    await page.setViewportSize({ height: 844, width });
    await openStory(page, storyId);
    await page.locator(".customer-shell").waitFor();

    const geometry = await page.evaluate(() => {
      const selectors = [
        "#storybook-root",
        ".v-application",
        ".customer-shell",
      ];

      return selectors.map((selector) => {
        const element = document.querySelector(selector);

        if (!element) throw new Error(`Missing ${selector}`);

        const { width } = element.getBoundingClientRect();
        return { selector, width };
      });
    });

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    expect(geometry).toHaveLength(3);
    expect(geometry.every((item) => Math.abs(item.width - width) <= 1)).toBe(
      true,
    );

    if (width < 1024) {
      await expect(
        page.locator(".shell-navigation__mobile-header"),
      ).toBeVisible();
      await expect(page.locator(".shell-navigation__sidebar")).toBeHidden();
    } else {
      await expect(
        page.locator(".shell-navigation__mobile-header"),
      ).toBeHidden();
      await expect(page.locator(".shell-navigation__sidebar")).toBeVisible();
    }
  }
});

test("I1-FO: sidebar labels and desktop Back stay readable", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 1023 });
  await openStory(
    page,
    "customer-journeys-customershell--authenticated-navigation-stack",
  );

  const tabletGeometry = await page
    .locator(".customer-shell")
    .evaluate((shell) => {
      const content = shell.querySelector(".customer-shell__content");

      if (!content) throw new Error("Customer shell content is required");

      return {
        contentWidth: content.getBoundingClientRect().width,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

  expect(tabletGeometry.contentWidth).toBe(1023);
  expect(tabletGeometry.scrollWidth).toBeLessThanOrEqual(1023);

  await openStory(page, "customer-screens-ordershistory--populated");

  const ordersTabletGeometry = await page
    .locator(".orders-history")
    .evaluate((ordersHistory) => {
      const header = ordersHistory.querySelector(".orders-history__header");
      const headerCopy = header?.querySelector("div");
      const list = ordersHistory.querySelector(".orders-history__list");
      const firstCard = list?.querySelector(".order-card");

      if (!header || !headerCopy || !list || !firstCard)
        throw new Error("Orders layout regions are required");

      const headerRect = header.getBoundingClientRect();
      const headerCopyRect = headerCopy.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const firstCardRect = firstCard.getBoundingClientRect();

      return {
        headerCoversViewport:
          headerRect.left === 0 && headerRect.right === window.innerWidth,
        headerCopyLeft: headerCopyRect.left,
        listWidth: listRect.width,
        firstCardLeft: firstCardRect.left,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

  expect(ordersTabletGeometry.headerCoversViewport).toBe(true);
  expect(ordersTabletGeometry.listWidth).toBeLessThanOrEqual(736);
  expect(ordersTabletGeometry.headerCopyLeft).toBeCloseTo(
    ordersTabletGeometry.firstCardLeft,
    0,
  );
  expect(ordersTabletGeometry.scrollWidth).toBeLessThanOrEqual(1023);

  await page.setViewportSize({ height: 844, width: 1024 });
  await openStory(
    page,
    "customer-journeys-customershell--authenticated-navigation-stack",
  );

  const desktopGeometry = await page
    .locator(".customer-shell")
    .evaluate((shell) => {
      const sidebar = shell.querySelector(".shell-navigation__sidebar");
      const back = shell.querySelector(".customer-shell__desktop-back");

      if (!sidebar || !back)
        throw new Error("Desktop shell controls are required");

      const labels = [
        ...sidebar.querySelectorAll(".shell-navigation__nav .ui-btn"),
      ].map((button) => {
        const content = button.querySelector(".v-btn__content");

        if (!content) throw new Error("Vuetify button content is required");

        return {
          contrast:
            getComputedStyle(button).color !==
            getComputedStyle(button).backgroundColor,
          text: button.textContent?.trim(),
          visible: content.getBoundingClientRect().width > 0,
          fits: content.scrollWidth <= content.clientWidth,
        };
      });
      const backRect = back.getBoundingClientRect();
      const backStyle = getComputedStyle(back);

      return {
        backContrast: backStyle.color !== backStyle.backgroundColor,
        backVisible: backRect.width > 0 && backRect.height > 0,
        labels,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

  expect(desktopGeometry.scrollWidth).toBeLessThanOrEqual(1024);
  expect(desktopGeometry.backVisible).toBe(true);
  expect(desktopGeometry.backContrast).toBe(true);
  expect(desktopGeometry.labels).not.toHaveLength(0);
  expect(
    desktopGeometry.labels.every(
      (label) =>
        Boolean(label.text) && label.contrast && label.visible && label.fits,
    ),
  ).toBe(true);
});

test("mobile navigation не перекрывает brand и переключает shell", async ({
  page,
}) => {
  const storyId = "components-patterns-shellnavigation--selected-category";

  for (const width of [320, 390]) {
    await page.setViewportSize({ height: 844, width });
    await openStory(page, storyId);

    const geometry = await page
      .locator(".shell-navigation__mobile-header")
      .evaluate((header) => {
        const headerRect = header.getBoundingClientRect();
        const children = [...header.children].map((element) => {
          const { bottom, height, left, right, top, width } =
            element.getBoundingClientRect();

          return { bottom, height, left, right, top, width };
        });
        const buttons = [...header.querySelectorAll("button")].map((button) => {
          const { height, width } = button.getBoundingClientRect();

          return { height, width };
        });
        const hasOverlap = children.some((item, index) =>
          children
            .slice(index + 1)
            .some(
              (other) =>
                item.left < other.right &&
                item.right > other.left &&
                item.top < other.bottom &&
                item.bottom > other.top,
            ),
        );

        return {
          buttons,
          fitsHeader: children.every(
            (item) =>
              item.left >= headerRect.left && item.right <= headerRect.right,
          ),
          hasOverlap,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
    expect(geometry.fitsHeader).toBe(true);
    expect(geometry.hasOverlap).toBe(false);
    expect(geometry.buttons).toHaveLength(4);
    expect(
      geometry.buttons.every(
        (button) => button.width >= 44 && button.height >= 44,
      ),
    ).toBe(true);
  }

  await page.setViewportSize({ height: 844, width: 1023 });
  await openStory(page, storyId);
  await expect(page.locator(".shell-navigation__mobile-header")).toBeVisible();
  await expect(page.locator(".shell-navigation__sidebar")).toBeHidden();

  await page.setViewportSize({ height: 844, width: 1024 });
  await openStory(page, storyId);
  await expect(page.locator(".shell-navigation__mobile-header")).toBeHidden();
  await expect(page.locator(".shell-navigation__sidebar")).toBeVisible();
});

test("account control fits desktop sidebar", async ({ page }) => {
  const cases = [
    "components-patterns-shellnavigation--default",
    "components-patterns-shellnavigation--authenticated",
  ];

  for (const width of [1024, 1280]) {
    for (const storyId of cases) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);

      const geometry = await page
        .locator(".shell-navigation__account")
        .evaluate((account) => {
          const accountRect = account.getBoundingClientRect();
          const isInsideAccount = (rect) =>
            rect.left >= accountRect.left &&
            rect.right <= accountRect.right &&
            rect.top >= accountRect.top &&
            rect.bottom <= accountRect.bottom;
          const childRects = [...account.children]
            .map((child) => child.getBoundingClientRect())
            .filter((rect) => rect.width > 0 && rect.height > 0);
          const walker = document.createTreeWalker(
            account,
            NodeFilter.SHOW_TEXT,
          );
          const textRects = [];
          let node = walker.nextNode();

          while (node) {
            if (node.textContent?.trim()) {
              const range = document.createRange();
              range.selectNodeContents(node);
              const rect = range.getBoundingClientRect();

              if (rect.width > 0 && rect.height > 0) textRects.push(rect);
            }

            node = walker.nextNode();
          }

          return {
            childrenFit: childRects.every(isInsideAccount),
            contentFits: account.scrollWidth <= account.clientWidth,
            documentFits:
              document.documentElement.scrollWidth <= window.innerWidth,
            textFits: textRects.every(isInsideAccount),
          };
        });

      expect(geometry.documentFits).toBe(true);
      expect(geometry.contentFits).toBe(true);
      expect(geometry.childrenFit).toBe(true);
      expect(geometry.textFits).toBe(true);
    }
  }
});

test("long category stays inside card", async ({ page }) => {
  const width = 390;

  await page.setViewportSize({ height: 844, width });
  await openStory(page, "customer-screens-menuroot--long");

  const geometry = await page.locator(".menu-root__card").evaluate((card) => {
    const { height, left, right } = card.getBoundingClientRect();
    const content = card.querySelector(".menu-root__content");
    const arrow = card.querySelector(".menu-root__arrow");

    if (!content || !arrow) throw new Error("Menu card regions are required");

    const contentRect = content.getBoundingClientRect();
    const arrowRect = arrow.getBoundingClientRect();

    return {
      arrowVisible: arrowRect.width > 0 && arrowRect.height > 0,
      card: { height, left, right },
      contentFits: content.scrollWidth <= content.clientWidth,
      contentWrapped: contentRect.height > 24,
      documentScrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(geometry.documentScrollWidth).toBeLessThanOrEqual(width);
  expect(geometry.card.left).toBeGreaterThanOrEqual(0);
  expect(geometry.card.right).toBeLessThanOrEqual(width);
  expect(geometry.card.height).toBeGreaterThanOrEqual(44);
  expect(geometry.arrowVisible).toBe(true);
  expect(geometry.contentFits).toBe(true);
  expect(geometry.contentWrapped).toBe(true);
});

test("wrapped category expands without clipping", async ({ page }) => {
  const cases = [
    { storyId: "customer-screens-menuroot--long", width: 390 },
    { storyId: "customer-screens-menuroot--default", width: 1024 },
  ];

  for (const { storyId, width } of cases) {
    await page.setViewportSize({ height: 844, width });
    await openStory(page, storyId);
    await page.locator(".menu-root__card").first().waitFor();

    const geometry = await page
      .locator(".menu-root__card")
      .evaluateAll((cards) =>
        cards.map((card) => {
          const cardRect = card.getBoundingClientRect();
          const content = card.querySelector(".menu-root__content");
          const arrow = card.querySelector(".menu-root__arrow");

          if (!content || !arrow)
            throw new Error("Menu card regions are required");

          const contentRect = content.getBoundingClientRect();
          const arrowRect = arrow.getBoundingClientRect();

          return {
            cardInside:
              cardRect.left >= 0 && cardRect.right <= window.innerWidth,
            contentInside:
              contentRect.top >= cardRect.top &&
              contentRect.bottom <= cardRect.bottom,
            heightFits: card.scrollHeight <= card.clientHeight,
            minTouchHeight: cardRect.height >= 44,
            arrowInside:
              arrowRect.width > 0 &&
              arrowRect.height > 0 &&
              arrowRect.top >= cardRect.top &&
              arrowRect.bottom <= cardRect.bottom &&
              arrowRect.right <= cardRect.right,
          };
        }),
      );

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    expect(geometry).not.toHaveLength(0);
    expect(geometry.every((card) => card.heightFits)).toBe(true);
    expect(geometry.every((card) => card.contentInside)).toBe(true);
    expect(geometry.every((card) => card.arrowInside)).toBe(true);
    expect(geometry.every((card) => card.cardInside)).toBe(true);
    expect(geometry.every((card) => card.minTouchHeight)).toBe(true);
  }
});

test("status summaries preserve total without overflow", async ({ page }) => {
  const width = 390;
  const storyIds = [
    "customer-screens-ordershistory--populated",
    "customer-screens-ordershistory--pending",
    "customer-screens-ordershistory--preparing",
    "customer-screens-ordershistory--completed",
    "customer-screens-ordershistory--cancelled",
    "customer-screens-ordershistory--long",
  ];

  for (const storyId of storyIds) {
    await page.setViewportSize({ height: 844, width });
    await openStory(page, storyId);
    await page.locator(".order-card__summary").first().waitFor();

    const geometry = await page
      .locator(".order-card__summary")
      .evaluateAll((cards) =>
        cards.map((card) => {
          const cardRect = card.getBoundingClientRect();
          const content = card.querySelector(".order-card__summary-content");
          const total = card.querySelector(".order-card__total");

          if (!content || !total)
            throw new Error("Order summary regions are required");

          const totalRect = total.getBoundingClientRect();

          return {
            cardRight: cardRect.right,
            contentFits: content.scrollWidth <= content.clientWidth,
            totalVisible:
              totalRect.width > 0 && totalRect.right <= cardRect.right,
          };
        }),
      );

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    expect(geometry).not.toHaveLength(0);
    expect(geometry.every((card) => card.cardRight <= width)).toBe(true);
    expect(geometry.every((card) => card.contentFits)).toBe(true);
    expect(geometry.every((card) => card.totalVisible)).toBe(true);
  }
});

test("wrapped summary expands without clipping", async ({ page }) => {
  const storyIds = [
    "customer-screens-ordershistory--populated",
    "customer-screens-ordershistory--pending",
    "customer-screens-ordershistory--preparing",
    "customer-screens-ordershistory--ready",
    "customer-screens-ordershistory--completed",
    "customer-screens-ordershistory--cancelled",
    "customer-screens-ordershistory--expanded",
    "customer-screens-ordershistory--long",
  ];

  for (const width of [390, 1024]) {
    for (const storyId of storyIds) {
      await page.setViewportSize({ height: 844, width });
      await openStory(page, storyId);
      await page.locator(".order-card__summary").first().waitFor();

      const geometry = await page
        .locator(".order-card__summary")
        .evaluateAll((summaries) =>
          summaries.map((summary) => {
            const summaryRect = summary.getBoundingClientRect();
            const content = summary.querySelector(
              ".order-card__summary-content",
            );
            const total = summary.querySelector(".order-card__total");

            if (!content || !total)
              throw new Error("Order summary regions are required");

            const contentRect = content.getBoundingClientRect();
            const totalRect = total.getBoundingClientRect();

            return {
              contentInside:
                contentRect.top >= summaryRect.top &&
                contentRect.bottom <= summaryRect.bottom,
              heightFits: summary.scrollHeight <= summary.clientHeight,
              summaryRight: summaryRect.right,
              totalInside:
                totalRect.width > 0 &&
                totalRect.top >= summaryRect.top &&
                totalRect.bottom <= summaryRect.bottom &&
                totalRect.right <= summaryRect.right,
            };
          }),
        );

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      expect(geometry).not.toHaveLength(0);
      expect(geometry.every((summary) => summary.heightFits)).toBe(true);
      expect(geometry.every((summary) => summary.contentInside)).toBe(true);
      expect(geometry.every((summary) => summary.totalInside)).toBe(true);
      expect(geometry.every((summary) => summary.summaryRight <= width)).toBe(
        true,
      );
    }
  }
});
