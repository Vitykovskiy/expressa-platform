import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FoundationsSpecimen from "./FoundationsSpecimen.vue";

const meta = {
  component: FoundationsSpecimen,
  title: "Foundations/Tokens",
} satisfies Meta<typeof FoundationsSpecimen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};
