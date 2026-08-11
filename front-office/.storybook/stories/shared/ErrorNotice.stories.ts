import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

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
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const RequestError: Story = {
  args: {
    onClose: fn(),
    error: {
      message: "Сервис временно недоступен.",
      requestId: "req-0016",
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Сервис временно недоступен.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Закрыть" }));
    await expect(args.onClose).toHaveBeenCalledOnce();
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
    onClose: fn(),
  },
};
