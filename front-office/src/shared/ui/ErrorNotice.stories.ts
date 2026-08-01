import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'

import ErrorNotice from './ErrorNotice.vue'

const meta = {
  component: ErrorNotice,
  title: 'Foundations/ErrorNotice',
} satisfies Meta<typeof ErrorNotice>

export default meta

type Story = StoryObj<typeof meta>

export const RequestError: Story = {
  args: {
    onClose: fn(),
    error: {
      message: 'Сервис временно недоступен.',
      requestId: 'req-0016',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Сервис временно недоступен.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Закрыть' }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
