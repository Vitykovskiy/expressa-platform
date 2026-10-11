import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiCheckbox from "./UiCheckbox.vue";

export default {
  title: "Компоненты/Флажок",
  component: UiCheckbox,
  args: { label: "Показывать в списке", modelValue: false },
  render: (args) => ({
    components: { UiCheckbox },
    setup() {
      const value = shallowRef(args.modelValue);

      return { args, value };
    },
    template:
      '<section class="storybook-case"><UiCheckbox v-bind="args" v-model="value" /></section>',
  }),
} satisfies Meta<typeof UiCheckbox>;

export const Default: StoryObj<typeof UiCheckbox> = {};
export const Checked: StoryObj<typeof UiCheckbox> = {
  args: { modelValue: true },
};
export const Disabled: StoryObj<typeof UiCheckbox> = {
  args: { modelValue: true, disabled: true },
};
export const LongLabel: StoryObj<typeof UiCheckbox> = {
  args: {
    label:
      "Показывать сезонные напитки без добавления сахара и искусственных ароматизаторов в списке",
  },
};
