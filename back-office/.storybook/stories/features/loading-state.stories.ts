import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LoadingState from "../../../src/pages/admin/auth/LoadingState.vue";
const meta = {
  title: "Features/Authentication/LoadingState",
  component: LoadingState,
} satisfies Meta<typeof LoadingState>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
