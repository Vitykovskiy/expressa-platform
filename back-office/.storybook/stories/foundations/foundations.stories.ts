import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onMounted, shallowRef } from "vue";
import { VApp } from "vuetify/components";

const tokenFamilies = [
  ["Цвет", "Canvas", "--expressa-color-surface-raised", "color"],
  ["Типографика", "Body", "--expressa-font-size-body", "font-size"],
  ["Отступ", "Control inline", "--expressa-space-control-inline", "margin-top"],
  ["Размер", "Control", "--expressa-size-control-min-height", "height"],
  ["Граница", "Default", "--expressa-border-width-default", "border-top-width"],
  ["Радиус", "Panel", "--expressa-radius-panel", "border-top-left-radius"],
  ["Тень", "Card", "--expressa-shadow-card", "box-shadow"],
  [
    "Движение",
    "Control",
    "--expressa-motion-duration-control",
    "transition-duration",
  ],
] as const;

function resolveToken(token: string, property: string): string {
  const element = document.createElement("div");
  if (property === "border-top-width") {
    element.style.borderTop = `var(${token}) solid transparent`;
  } else {
    element.style.setProperty(property, `var(${token})`);
  }
  document.body.append(element);
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  element.remove();
  return value;
}

const meta = {
  title: "Foundations/Tokens",
  component: VApp,
  parameters: { layout: "padded" },
} satisfies Meta<typeof VApp>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Values: Story = {
  render: () => ({
    setup: () => {
      const tokens = shallowRef(
        tokenFamilies.map(([family, role, token]) => ({
          family,
          role,
          token,
          value: "",
        })),
      );

      onMounted(() => {
        tokens.value = tokenFamilies.map(([family, role, token, property]) => ({
          family,
          role,
          token,
          value: resolveToken(token, property),
        }));
      });

      return { tokens };
    },
    template: `
      <dl>
        <div v-for="item in tokens" :key="item.token">
          <dt>{{ item.family }} · {{ item.role }}</dt>
          <dd>{{ item.token }}: {{ item.value }}</dd>
        </div>
      </dl>
    `,
  }),
};
