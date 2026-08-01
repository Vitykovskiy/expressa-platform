import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { vuetify } from '../src/app/plugins'

import 'vuetify/styles'

setup((app) => {
  app.use(vuetify)
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
