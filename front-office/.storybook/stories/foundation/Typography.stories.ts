import type { Meta, StoryObj } from "@storybook/vue3-vite";
const sizes = [
  "2xs",
  "caption",
  "xs",
  "sm",
  "body",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "state",
  "display",
];
const weights = ["regular", "semibold", "bold", "extrabold", "black"];
const lineHeights = ["tight", "none", "compact", "label", "body", "relaxed"];
const spacing = ["tight", "slight", "label", "overline", "otp"];
const meta = {
  title: "Foundation/Typography",
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Полная типографическая шкала из `src/styles/customer-tokens.css`: fallback stack `Nunito, Inter, system-ui, sans-serif`, все sizes, weights, line-height и letter-spacing. Web-font asset Storybook не загружает: specimen использует token fallback stack текущего окружения. Таблицы не задают семантику HTML headings. Static specimen: props, emits, slots, actions и states отсутствуют.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  render: () => ({
    data: () => ({ lineHeights, sizes, spacing, weights }),
    template: `<div style="display:grid;gap:var(--customer-space-9);width:100%;max-width:56rem;font-family:var(--customer-font-family)"><p><code>--customer-font-family</code>: Customer type stack</p><section><h2>Sizes</h2><p v-for="token in sizes" :key="token" :style="{fontSize:'var(--customer-font-size-'+token+')',lineHeight:'var(--customer-line-height-tight)',margin:'var(--customer-space-3) 0'}"><code>--customer-font-size-{{ token }}</code> Customer specimen</p></section><section><h2>Weights</h2><p v-for="token in weights" :key="token" :style="{fontWeight:'var(--customer-font-weight-'+token+')'}"><code>--customer-font-weight-{{ token }}</code> Customer specimen</p></section><section><h2>Line heights and letter spacing</h2><table style="width:100%"><tbody><tr v-for="token in lineHeights" :key="token"><td><code>--customer-line-height-{{ token }}</code></td><td :style="{lineHeight:'var(--customer-line-height-'+token+')'}">Line-height specimen</td></tr><tr v-for="token in spacing" :key="token"><td><code>--customer-letter-spacing-{{ token }}</code></td><td :style="{letterSpacing:'var(--customer-letter-spacing-'+token+')'}">Letter spacing specimen</td></tr></tbody></table></section></div>`,
  }),
};
