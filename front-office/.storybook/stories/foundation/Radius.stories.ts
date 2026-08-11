import type { Meta, StoryObj } from "@storybook/vue3-vite";
const canonicalRadii = ["sm", "md", "lg", "xl", "pill"];
const meta = {
  title: "Foundation/Radius",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Публичная шкала radius из `src/styles/customer-tokens.css`: sm, md, lg, xl и pill. `pill` применяют для капсульной формы. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  render: () => ({
    data: () => ({ canonicalRadii }),
    template: `<div style="display:grid;gap:var(--customer-space-9);width:100%"><section style="display:flex;flex-wrap:wrap;gap:var(--customer-space-9)"><div v-for="suffix in canonicalRadii" :key="suffix" style="min-width:8rem"><div :style="{width:suffix === 'pill' ? 'var(--customer-size-state-icon)' : 'var(--customer-space-17)',height:'var(--customer-space-17)',border:'1px solid var(--customer-border)',borderRadius:'var(--customer-radius-'+suffix+')',background:'var(--customer-surface)'}"></div><code>--customer-radius-{{ suffix }}</code></div></section></div>`,
  }),
};
