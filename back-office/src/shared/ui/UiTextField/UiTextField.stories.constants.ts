import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiTextField from "./UiTextField.vue";

export default {
  title: "Компоненты/Текстовое поле",
  component: UiTextField,
  args: { label: "Название", modelValue: "" },
  render: (args) => ({
    components: { UiTextField },
    setup() {
      const value = shallowRef(args.modelValue);

      return { args, value };
    },
    template:
      '<section class="storybook-case"><UiTextField v-bind="args" v-model="value" /></section>',
  }),
} satisfies Meta<typeof UiTextField>;

export const Empty: StoryObj<typeof UiTextField> = {};
export const Filled: StoryObj<typeof UiTextField> = {
  args: { modelValue: "Лимонад с чёрной смородиной" },
};
export const Error: StoryObj<typeof UiTextField> = {
  args: {
    modelValue: "Лимонад",
    error:
      "Название уже используется. Измените название и повторите сохранение.",
  },
};
export const Disabled: StoryObj<typeof UiTextField> = {
  args: { modelValue: "Лимонад", disabled: true },
};
export const ReadOnly: StoryObj<typeof UiTextField> = {
  args: { modelValue: "Лимонад", readOnly: true },
};
export const Search: StoryObj<typeof UiTextField> = {
  args: { type: "search", label: "Поиск", modelValue: "" },
};
export const Number: StoryObj<typeof UiTextField> = {
  args: { type: "number", label: "Цена", modelValue: "1290" },
};
export const LongContent: StoryObj<typeof UiTextField> = {
  args: {
    label:
      "Название сезонного напитка без добавления сахара и искусственных ароматизаторов",
    modelValue:
      "Лимонад с чёрной смородиной и розмарином без добавления сахара",
    hint: "Название сохраняется целиком",
  },
};
