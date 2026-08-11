import type { Meta, StoryObj } from "@storybook/vue3-vite";
const breakpoints = [
  [
    "--customer-breakpoint-sm",
    "480px",
    "sm starts at 480px; 0–479px is mobile",
  ],
  [
    "--customer-breakpoint-md",
    "768px",
    "md starts at 768px; 480–767px is compact",
  ],
  [
    "--customer-breakpoint-lg",
    "1024px",
    "lg starts at 1024px; 768–1023px is medium",
  ],
  [
    "--customer-breakpoint-xl",
    "1280px",
    "xl starts at 1280px; 1024–1279px is desktop",
  ],
  ["--customer-content-width", "27.5rem", "default content width"],
] as const;
const meta = {
  title: "Foundation/Breakpoints",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Точные responsive thresholds from `src/styles/customer-tokens.css`: min-width 480, 768, 1024, 1280px and default content width. No implicit 479/767/1023 token exists; preceding range ends one CSS pixel before next boundary. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Thresholds: Story = {
  render: () => ({
    data: () => ({ breakpoints }),
    template: `<table style="width:100%"><thead><tr><th>Token</th><th>Exact value</th><th>Range / behavior</th></tr></thead><tbody><tr v-for="row in breakpoints" :key="row[0]"><td><code>{{ row[0] }}</code></td><td><code>{{ row[1] }}</code></td><td>{{ row[2] }}</td></tr></tbody></table>`,
  }),
};
