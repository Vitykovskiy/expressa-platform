import type { Meta, StoryObj } from "@storybook/vue3-vite";
const tokens = [
  "--customer-duration-fast",
  "--customer-duration-base",
  "--customer-easing-standard",
  "--customer-transform-press",
  "--customer-transition-transform",
  "--customer-transition-surface",
];
const meta = {
  title: "Foundation/Motion",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Полный motion catalog из `src/styles/customer-tokens.css`: duration, easing, press transform and transitions. Interactive consumers honour `prefers-reduced-motion`; this table does not create an animation contract. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tokens: Story = {
  render: () => ({
    data: () => ({ tokens }),
    template: `<table style="width:100%"><tbody><tr v-for="token in tokens" :key="token"><td style="padding:var(--customer-space-5)"><code>{{ token }}</code></td><td style="padding:var(--customer-space-5)">Token authority value</td></tr></tbody></table>`,
  }),
};
