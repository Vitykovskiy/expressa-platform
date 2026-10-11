import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiSwitch from "./UiSwitch.vue";

export default {
  title: "Компоненты/Переключатель",
  component: UiSwitch,
  args: { label: "Доступен", modelValue: false },
  render: (args) => ({
    components: { UiSwitch },
    setup() {
      const value = shallowRef(args.modelValue);

      return { args, value };
    },
    template:
      '<section class="storybook-case"><UiSwitch v-bind="args" v-model="value" /></section>',
  }),
} satisfies Meta<typeof UiSwitch>;

export const Off: StoryObj<typeof UiSwitch> = {};
export const On: StoryObj<typeof UiSwitch> = { args: { modelValue: true } };
export const Pending: StoryObj<typeof UiSwitch> = {
  args: { modelValue: true, pending: true },
};
export const Disabled: StoryObj<typeof UiSwitch> = {
  args: { modelValue: false, disabled: true },
};
