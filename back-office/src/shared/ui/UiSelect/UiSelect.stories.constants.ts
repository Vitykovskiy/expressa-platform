import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiSelect from "./UiSelect.vue";

export default {
  title: "Компоненты/Выбор",
  component: UiSelect,
  args: {
    label: "Категория",
    modelValue: null,
    options: [
      { value: "drinks", label: "Напитки" },
      {
        value: "seasonal",
        label:
          "Сезонные напитки без добавления сахара и искусственных ароматизаторов",
      },
      { value: "archived", label: "Архив", disabled: true },
    ],
  },
  render: (args) => ({
    components: { UiSelect },
    setup() {
      const value = shallowRef(args.modelValue);

      return { args, value };
    },
    template:
      '<section class="storybook-case"><UiSelect v-bind="args" v-model="value" /></section>',
  }),
} satisfies Meta<typeof UiSelect>;

export const Empty: StoryObj<typeof UiSelect> = {};
export const Selected: StoryObj<typeof UiSelect> = {
  args: { modelValue: "drinks" },
};
export const LongSelection: StoryObj<typeof UiSelect> = {
  args: { modelValue: "seasonal" },
};
export const Disabled: StoryObj<typeof UiSelect> = {
  args: { modelValue: "drinks", disabled: true },
};
export const Error: StoryObj<typeof UiSelect> = {
  args: { error: "Выберите доступную категорию" },
};
export const NoOptions: StoryObj<typeof UiSelect> = { args: { options: [] } };
