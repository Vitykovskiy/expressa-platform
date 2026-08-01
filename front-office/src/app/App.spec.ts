import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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
  it('показывает заголовок клиентского приложения', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    })

    expect(wrapper.get('h1').text()).toBe('Expressa')
  })
})
