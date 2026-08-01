import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import 'vuetify/styles'

import { vuetify } from '../src/app/plugins'
import { router } from '../src/app/router'

setup((app) => {
  app.use(createPinia())
  app.use(vuetify)
  app.use(router)
})

const preview: Preview = {
  parameters: {
    a11y: {
      test: 'error',
    },
    layout: 'padded',
  },
}

export default preview
