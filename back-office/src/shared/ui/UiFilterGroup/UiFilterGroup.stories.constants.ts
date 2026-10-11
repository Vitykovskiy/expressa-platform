import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiFilterGroup from "./UiFilterGroup.vue";

export default {
  title: "Компоненты/Фильтры",
  component: UiFilterGroup,
  args: {
    label: "Позиции",
    modelValue: "all",
    options: [
      { value: "all", label: "Все" },
      { value: "available", label: "Доступные" },
      { value: "unavailable", label: "Недоступные" },
    ],
  },
  render: (args) => ({
    components: { UiFilterGroup },
    setup() {
      const value = shallowRef(args.modelValue);

      return { args, value };
    },
    template:
      '<section class="storybook-case"><UiFilterGroup v-bind="args" v-model="value" /></section>',
  }),
} satisfies Meta<typeof UiFilterGroup>;

export const Default: StoryObj<typeof UiFilterGroup> = {};
export const Disabled: StoryObj<typeof UiFilterGroup> = {
  args: { disabled: true },
};
export const LongOptions: StoryObj<typeof UiFilterGroup> = {
  args: {
    options: [
      { value: "all", label: "Все позиции" },
      {
        value: "available",
        label: "Доступные сезонные напитки без добавления сахара",
      },
      { value: "unavailable", label: "Недоступные позиции каталога" },
    ],
  },
};
