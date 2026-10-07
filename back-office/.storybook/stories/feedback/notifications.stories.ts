import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, onBeforeUnmount } from "vue";

import { ApiError } from "../../../src/shared/api/client";
import { getOperationPort } from "../../../src/shared/lib/operations/operation-port";

const meta = {
  title: "Компоненты/Обратная связь/Уведомления",
  id: "feedback-notifications",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function renderNotification(requestId: string | null) {
  return defineComponent({
    setup() {
      const runtime = getOperationPort();
      const epoch =
        requestId === null
          ? "storybook-error-notice-without-request-id"
          : "storybook-notifications-default";
      void runtime.run(
        {
          attemptId: epoch,
          epoch,
          kind: "read",
          operationKey: "catalog.load",
          origin: "user",
          ownerIsActive: () => true,
          resourceKey: "catalog",
        },
        async () => {
          throw new ApiError({
            code: "NETWORK_ERROR",
            details: null,
            message: "story failure",
            occurrenceId: epoch,
            requestId,
            status: null,
            transportKind: "network",
          });
        },
      );
      onBeforeUnmount(() => runtime.clearSession(epoch));
      return () => null;
    },
  });
}

export const Default: Story = {
  name: "Обычное состояние",
  render: () => renderNotification("req-story"),
};
export const WithoutRequestId: Story = {
  name: "Без номера запроса",
  render: () => renderNotification(null),
};
