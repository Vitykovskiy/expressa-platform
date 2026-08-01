import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import MenuPage from '../pages/MenuPage.vue'
import App from './App.vue'
import { vuetify } from './plugins'

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect(): void {}

  observe(): void {
    void this.callback
  }

  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock

describe('App', () => {
  it('показывает содержимое текущего маршрута', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: MenuPage }],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [vuetify, createPinia(), router],
      },
    })

    expect(wrapper.get('h1').text()).toBe('Меню')
  })
})
