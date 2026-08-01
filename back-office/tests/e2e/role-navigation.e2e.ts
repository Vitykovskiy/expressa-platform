import { expect, test } from '@playwright/test'

const storyPath = (name: string): string =>
  `/iframe.html?id=compositions-role-navigation--${name}&viewMode=story`

test('admin видит все рабочие разделы', async ({ page }) => {
  await page.goto(storyPath('admin'))

  await expect(page.getByRole('link', { name: 'Очередь' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Доступность' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Меню' })).toBeVisible()
})

test('manager видит меню', async ({ page }) => {
  await page.goto(storyPath('manager'))

  await expect(page.getByRole('link', { name: 'Меню' })).toBeVisible()
})

test('barista не видит меню', async ({ page }) => {
  await page.goto(storyPath('barista'))

  await expect(page.getByRole('link', { name: 'Очередь' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Доступность' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Меню' })).toHaveCount(0)
})
