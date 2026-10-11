import type { Meta, StoryObj } from "@storybook/vue3-vite";
import FoundationWorkbench from "./FoundationWorkbench.vue";

export default {
  title: "Основа/Композиция",
  component: FoundationWorkbench,
} satisfies Meta<typeof FoundationWorkbench>;

export const Default: StoryObj<typeof FoundationWorkbench> = {};
