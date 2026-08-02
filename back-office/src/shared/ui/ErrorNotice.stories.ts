import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent } from "storybook/test";

import ErrorNotice from "./ErrorNotice.vue";

const meta = {
  title: "Feedback/Error notice",
  component: ErrorNotice,
  args: {
    error: {
      message: "Изменение не принято.",
      requestId: "request-42",
    },
    onClose: fn(),
  },
} satisfies Meta<typeof ErrorNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RequestRejected: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText("Номер запроса: request-42")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Закрыть" }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const WithoutRequestNumber: Story = {
  args: {
    error: {
      message: "Сервер временно недоступен.",
      requestId: null,
    },
  },
};

export const LongError: Story = {
  args: {
    error: {
      message:
        "Сервер не принял изменение доступности. Проверьте соединение, повторите действие позже или передайте номер запроса в поддержку.",
      requestId: "request-with-a-long-identifier-for-support",
    },
  },
};
