import { describe, expect, it } from 'vitest'

import { navigationItems } from './navigation'
import { createBackOfficeRouter } from './router'

describe('маршруты back-office', () => {
  it('открывает очередь без проверки сессии', async () => {
    const router = createBackOfficeRouter()

    await router.push('/queue')

    expect(router.currentRoute.value.path).toBe('/queue')
  })

  it('открывает меню без ограничений оболочки', async () => {
    const router = createBackOfficeRouter()

    await router.push('/menu')

    expect(router.currentRoute.value.path).toBe('/menu')
  })

  it('перенаправляет корневой маршрут в очередь', async () => {
    const router = createBackOfficeRouter()

    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/queue')
  })

  it('содержит статические ссылки рабочих разделов', () => {
    expect(navigationItems.map((item) => item.path)).toEqual([
      '/queue',
      '/availability',
      '/menu',
    ])
  })
})
