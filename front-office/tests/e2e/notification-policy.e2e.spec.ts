import { expect, test } from "@playwright/test";

test("постоянная точка управления уведомлениями находится в Аккаунте, а не в истории", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const account = page.getByRole("button", { name: "Аккаунт" });
  await expect(account).toBeVisible();
  await account.click();
  await expect(page.getByRole("heading", { name: "Аккаунт" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Уведомления о заказах" }),
  ).toBeVisible();
  await expect(page.getByText("Вы не вошли в аккаунт")).toBeVisible();
  await expect(
    page.getByText(
      "Уведомления запрещены в настройках устройства или браузера.",
    ),
  ).toBeVisible();
});
