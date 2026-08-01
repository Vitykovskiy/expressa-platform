import { expect, test } from '@playwright/test'

const visualStories = [
  ['page-shell', 'foundations-page-shell--default'],
  ['error-notice', 'feedback-error-notice--request-rejected'],
  ['barista-navigation', 'compositions-role-navigation--barista'],
] as const

for (const [name, story] of visualStories) {
  test(`визуальный снимок ${name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story}&viewMode=story`)
    await expect(page.locator('#storybook-root')).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
    })
  })
}
