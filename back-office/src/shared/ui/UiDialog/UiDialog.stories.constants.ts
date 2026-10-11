import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiDialog from "./UiDialog.vue";
import UiButton from "../UiButton/UiButton.vue";

export default {
  title: "Компоненты/Диалог",
  component: UiDialog,
  args: { open: false, title: "Архивировать позицию?" },
  render: (args) => ({
    components: { UiDialog, UiButton },
    setup() {
      const open = shallowRef(args.open);

      return { args, open };
    },
    template:
      '<section class="storybook-case"><UiButton aria-haspopup="dialog" @activate="open = true">Открыть диалог</UiButton><UiDialog v-bind="args" v-model:open="open"><p>Позиция останется в истории заказов.</p><template #actions><UiButton @activate="open = false">Отмена</UiButton><UiButton variant="danger" @activate="open = false">Архивировать</UiButton></template></UiDialog></section>',
  }),
} satisfies Meta<typeof UiDialog>;

export const Default: StoryObj<typeof UiDialog> = {};
export const Open: StoryObj<typeof UiDialog> = { args: { open: true } };
export const OwnerRestoresFocus: StoryObj<typeof UiDialog> = {
  args: { restoreFocus: false },
};
export const LongTitle: StoryObj<typeof UiDialog> = {
  args: {
    title:
      "Архивировать сезонный лимонад с чёрной смородиной и розмарином без добавления сахара?",
  },
};
export const Busy: StoryObj<typeof UiDialog> = {
  args: { dismissible: false },
  render: (args) => ({
    components: { UiDialog, UiButton },
    setup() {
      const open = shallowRef(false);

      return { args, open };
    },
    template:
      '<section class="storybook-case"><UiButton @activate="open = true">Открыть занятый диалог</UiButton><UiDialog v-bind="args" v-model:open="open"><p>Сохранение…</p><template #actions><UiButton disabled>Отмена</UiButton><UiButton variant="danger" loading>Архивировать</UiButton><UiButton @activate="open = false">Завершить действие</UiButton></template></UiDialog></section>',
  }),
};
