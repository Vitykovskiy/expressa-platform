import type { Meta, StoryObj } from "@storybook/vue3-vite";
const semantic = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"];
const compatibility = Array.from({ length: 21 }, (_, index) =>
  String(index + 1),
);
const sizes = [
  "icon-sm",
  "control-sm",
  "control-md",
  "control-lg",
  "control-xl",
  "field",
  "state-icon",
  "content-auth",
  "content-detail",
  "summary",
];
const meta = {
  title: "Foundation/Spacing",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Полная шкала spacing и size tokens из `src/styles/customer-tokens.css`. Semantic aliases — выбор для нового UI; numbered `--customer-space-*` — documented compatibility scale. Size tokens описывают fixed control/content bounds. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  render: () => ({
    data: () => ({ compatibility, semantic, sizes }),
    template: `<div style="display:grid;gap:var(--customer-space-9);width:100%;max-width:48rem"><section><h2>Semantic spacing</h2><div v-for="token in semantic" :key="token"><code>--customer-spacing-{{ token }}</code><span :style="{display:'inline-block',width:'var(--customer-spacing-'+token+')',height:'1rem',marginLeft:'1rem',background:'var(--customer-primary)'}"></span></div></section><section><h2>Compatibility spacing</h2><div v-for="token in compatibility" :key="token"><code>--customer-space-{{ token }}</code><span :style="{display:'inline-block',width:'var(--customer-space-'+token+')',height:'1rem',marginLeft:'1rem',background:'var(--customer-primary)'}"></span></div></section><section><h2>Size tokens</h2><table><tbody><tr v-for="token in sizes" :key="token"><td><code>--customer-size-{{ token }}</code></td><td :style="{paddingLeft:'1rem'}">{{ token }}</td></tr></tbody></table></section></div>`,
  }),
};
