import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const stories = [
  'foundations-page-shell--default',
  'feedback-error-notice--request-rejected',
  'compositions-navigation--default',
]

for (const story of stories) {
  test(`история ${story} не имеет нарушений доступности`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story}&viewMode=story`)

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
}
