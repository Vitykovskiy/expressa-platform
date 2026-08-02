import { expect, test } from '@playwright/test'

const storyPath = (name: string): string =>
  `/iframe.html?id=compositions-navigation--${name}&viewMode=story`

test('статическая навигация показывает все рабочие разделы', async ({ page }) => {
  await page.goto(storyPath('default'))

  await expect(page.getByRole('link', { name: 'Очередь' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Доступность' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Меню' })).toBeVisible()
})
