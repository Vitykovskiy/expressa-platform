import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { navigationItemsForRole } from './navigation'
import { createBackOfficeRouter } from './router'
import { useSessionStore } from './session.store'

describe('маршруты back-office', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('направляет анонимного сотрудника на вход', async () => {
    const router = createBackOfficeRouter()

    await router.push('/queue')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('не открывает меню бариста', async () => {
    useSessionStore().setAuthenticated('barista')
    const router = createBackOfficeRouter()

    await router.push('/menu')

    expect(router.currentRoute.value.path).toBe('/queue')
  })

  it.each(['admin', 'manager'] as const)('открывает меню для роли %s', async (role) => {
    useSessionStore().setAuthenticated(role)
    const router = createBackOfficeRouter()

    await router.push('/menu')

    expect(router.currentRoute.value.path).toBe('/menu')
  })

  it('показывает бариста только очередь и доступность', () => {
    expect(navigationItemsForRole('barista').map((item) => item.path)).toEqual([
      '/queue',
      '/availability',
    ])
  })
})
