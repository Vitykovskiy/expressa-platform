import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, onBeforeUnmount } from "vue";

import { ApiError } from "../../../src/shared/api/client";
import { getOperationPort } from "../../../src/shared/lib/operations/operation-port";

const meta = {
  title: "Feedback/ErrorNotice",
  id: "feedback-errornotice",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutRequestId: Story = {
  render: () =>
    defineComponent({
      setup() {
        const runtime = getOperationPort();
        const epoch = "storybook-error-notice-without-request-id";

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
              requestId: null,
              status: null,
              transportKind: "network",
            });
          },
        );

        onBeforeUnmount(() => runtime.clearSession(epoch));
        return () => null;
      },
    }),
};
