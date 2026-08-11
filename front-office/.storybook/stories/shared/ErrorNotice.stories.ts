import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ErrorNotice from "@/shared/ui/ErrorNotice.vue";

const meta = {
  component: ErrorNotice,
  title: "Foundations/ErrorNotice",
} satisfies Meta<typeof ErrorNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    error: null,
    onClose: () => undefined,
  },
};

export const RequestError: Story = {
  args: {
    onClose: () => undefined,
    error: {
      message: "Сервис временно недоступен.",
      requestId: "req-0016",
    },
  },
};

export const LongMessage: Story = {
  args: {
    error: {
      message:
        "Не удалось завершить операцию. Повторите попытку позже или обратитесь в поддержку, указав номер запроса.",
      requestId:
        "request-with-a-long-identifier-to-check-content-wrapping-000001",
    },
    onClose: () => undefined,
  },
};
