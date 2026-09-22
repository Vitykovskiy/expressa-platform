import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onMounted, shallowRef } from "vue";
import { VApp } from "vuetify/components";

import TokenShowcase from "./TokenShowcase.vue";

const tokenFamilies = [
  ["Цвет", "Canvas", "--expressa-color-surface-raised", "color", "color"],
  [
    "Типографика",
    "Body",
    "--expressa-font-size-body",
    "font-size",
    "typography",
  ],
  [
    "Отступ",
    "Control inline",
    "--expressa-space-control-inline",
    "margin-top",
    "spacing",
  ],
  ["Размер", "Control", "--expressa-size-control-min-height", "height", "size"],
  [
    "Граница",
    "Default",
    "--expressa-border-width-default",
    "border-top-width",
    "border",
  ],
  [
    "Радиус",
    "Panel",
    "--expressa-radius-panel",
    "border-top-left-radius",
    "radius",
  ],
  ["Тень", "Card", "--expressa-shadow-card", "box-shadow", "shadow"],
  [
    "Движение",
    "Control",
    "--expressa-motion-duration-control",
    "transition-duration",
    "motion",
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
    components: { TokenShowcase },
    setup: () => {
      const tokens = shallowRef(
        tokenFamilies.map(([family, role, token, , kind]) => ({
          family,
          role,
          token,
          kind,
          value: "",
        })),
      );

      onMounted(() => {
        tokens.value = tokenFamilies.map(
          ([family, role, token, property, kind]) => ({
            family,
            role,
            token,
            kind,
            value: resolveToken(token, property),
          }),
        );
      });

      return { tokens };
    },
    template: `<TokenShowcase :tokens="tokens" />`,
  }),
};
