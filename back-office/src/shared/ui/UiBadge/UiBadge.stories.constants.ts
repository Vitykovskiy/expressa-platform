import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UiBadge from "./UiBadge.vue";

export default {
  title: "Компоненты/Метка",
  component: UiBadge,
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiBadge v-bind="args">Доступен</UiBadge></section>',
  }),
} satisfies Meta<typeof UiBadge>;

export const Neutral: StoryObj<typeof UiBadge> = {};
export const Warning: StoryObj<typeof UiBadge> = {
  args: { tone: "warning" },
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiBadge v-bind="args">Требует внимания</UiBadge></section>',
  }),
};
export const Danger: StoryObj<typeof UiBadge> = {
  args: { tone: "danger" },
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiBadge v-bind="args">Ошибка сохранения</UiBadge></section>',
  }),
};
export const LongLabel: StoryObj<typeof UiBadge> = {
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template:
      '<section class="storybook-case"><UiBadge v-bind="args">Сезонная позиция без добавления сахара и искусственных ароматизаторов</UiBadge></section>',
  }),
};
