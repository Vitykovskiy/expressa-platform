import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiButton from "./UiButton.vue";

export default {
  title: "Компоненты/Кнопка",
  component: UiButton,
  args: { variant: "primary", disabled: false, loading: false },
  render: (args) => ({
    components: { UiButton },
    setup() {
      const activations = shallowRef(0);

      return { args, activations };
    },
    template:
      '<section class="storybook-case"><UiButton v-bind="args" @activate="activations++">Сохранить</UiButton><p>Действий: {{ activations }}</p></section>',
  }),
} satisfies Meta<typeof UiButton>;

export const Default: StoryObj<typeof UiButton> = {};
export const Secondary: StoryObj<typeof UiButton> = {
  args: { variant: "secondary" },
};
export const Quiet: StoryObj<typeof UiButton> = { args: { variant: "quiet" } };
export const Danger: StoryObj<typeof UiButton> = {
  args: { variant: "danger" },
};
export const Disabled: StoryObj<typeof UiButton> = { args: { disabled: true } };
export const Loading: StoryObj<typeof UiButton> = { args: { loading: true } };
export const LongLabel: StoryObj<typeof UiButton> = {
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiButton v-bind="args">Сохранить изменения в сезонных напитках без добавления сахара</UiButton></section>',
  }),
};
