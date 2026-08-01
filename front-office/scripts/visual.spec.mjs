import { expect, test } from '@playwright/test'

test('PageShell visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=foundations-pageshell--standard')

  await expect(page.locator('#storybook-root')).toHaveScreenshot('page-shell.png')
})

test('ErrorNotice visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=foundations-errornotice--request-error')

  await expect(page.locator('#storybook-root')).toHaveScreenshot('error-notice.png')
})
