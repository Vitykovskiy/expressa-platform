import { router } from './router'
import { useSessionStore } from './session.store'

import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect } from 'storybook/test'
import { defineComponent, h } from 'vue'

import App from './App.vue'

type Role = 'admin' | 'manager' | 'barista'

interface RoleNavigationArgs {
  role: Role
}

const meta = {
  title: 'Compositions/Role navigation',
  component: App,
  args: {
    role: 'admin',
  },
  render: (args) => {
    const sessionStore = useSessionStore()
    sessionStore.setAuthenticated(args.role)
    void router.replace('/queue')

    return defineComponent({
      setup: () => () => h(App),
    })
  },
} satisfies Meta<RoleNavigationArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Admin: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Очередь' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Доступность' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Меню' })).toBeVisible()
  },
}

export const Manager: Story = {
  args: { role: 'manager' },
  play: Admin.play,
}

export const Barista: Story = {
  args: { role: 'barista' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Очередь' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Доступность' })).toBeVisible()
    await expect(canvas.queryByRole('link', { name: 'Меню' })).toBeNull()
  },
}
