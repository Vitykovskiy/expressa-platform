import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiFeedback from "./UiFeedback.vue";
import UiButton from "../UiButton/UiButton.vue";

export default {
  title: "Компоненты/Обратная связь",
  component: UiFeedback,
  args: { kind: "empty", text: "Нет позиций" },
  render: (args) => ({
    components: { UiFeedback },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiFeedback v-bind="args" /></section>',
  }),
} satisfies Meta<typeof UiFeedback>;

export const Empty: StoryObj<typeof UiFeedback> = {};
export const Loading: StoryObj<typeof UiFeedback> = {
  args: { kind: "loading", text: "Загрузка списка…" },
};
export const Success: StoryObj<typeof UiFeedback> = {
  args: { kind: "success", text: "Изменения сохранены" },
};
export const Error: StoryObj<typeof UiFeedback> = {
  args: { kind: "error", text: "Не удалось загрузить список" },
  render: (args) => ({
    components: { UiFeedback, UiButton },
    setup() {
      const retried = shallowRef(false);

      return { args, retried };
    },
    template:
      '<section class="storybook-case"><UiFeedback v-if="!retried" v-bind="args"><template #action><UiButton @activate="retried = true">Повторить</UiButton></template></UiFeedback><UiFeedback v-else kind="loading" text="Загрузка списка…" announced /></section>',
  }),
};
