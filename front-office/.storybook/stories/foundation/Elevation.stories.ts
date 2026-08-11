import type { Meta, StoryObj } from "@storybook/vue3-vite";
const shadows = [
  "--customer-shadow-card",
  "--customer-shadow-card-raised",
  "--customer-shadow-floating",
  "--customer-shadow-surface",
  "--customer-shadow-state",
  "--customer-shadow-shell",
  "--customer-elevation-sm",
  "--customer-elevation-medium",
  "--customer-elevation-frame",
];
const meta = {
  title: "Foundation/Elevation",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Полный catalog shadow values и elevation aliases из `src/styles/customer-tokens.css`. `elevation-*` aliases сохраняют compatibility names; tokens не задают z-index. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  render: () => ({
    data: () => ({ shadows }),
    template: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:var(--customer-space-13);width:100%"><div v-for="token in shadows" :key="token" :style="{padding:'var(--customer-space-9)',color:'var(--customer-text-on-surface)',background:'var(--customer-surface)',borderRadius:'var(--customer-radius-md)',boxShadow:'var('+token+')'}"><code>{{ token }}</code></div></div>`,
  }),
};
