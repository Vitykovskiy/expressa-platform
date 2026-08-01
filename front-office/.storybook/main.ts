import { defineMain } from '@storybook/vue3-vite/node'

export default defineMain({
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/vue3-vite',
  stories: ['../src/**/*.stories.ts'],
})
