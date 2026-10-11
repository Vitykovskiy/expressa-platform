import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Foundations from "./Foundations.vue";

export default {
  title: "Основа/Tokens",
  component: Foundations,
} satisfies Meta<typeof Foundations>;

export const Default: StoryObj<typeof Foundations> = {};
