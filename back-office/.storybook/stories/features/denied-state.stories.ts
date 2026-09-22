import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DeniedState from "../../../src/pages/admin/auth/DeniedState.vue";
const meta = {
  title: "Features/Authentication/DeniedState",
  component: DeniedState,
} satisfies Meta<typeof DeniedState>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
