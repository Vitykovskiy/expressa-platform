import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Circle } from "lucide-vue-next";
import { shallowRef } from "vue";
import AdminActionGroup from "../../../src/shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../src/shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminProgress from "../../../src/shared/ui/admin/admin-progress/AdminProgress.vue";
import AdminRadioGroup from "../../../src/shared/ui/admin/admin-radio-group/AdminRadioGroup.vue";

const meta = {
  title: "Foundations/AdminPrimitives",
  component: AdminActionGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminActionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = {
  render: () => ({
    components: { AdminActionGroup, AdminButton },
    template:
      '<AdminActionGroup><AdminButton variant="secondary">Отмена</AdminButton><AdminButton>Сохранить</AdminButton></AdminActionGroup>',
  }),
};

export const Icon: Story = {
  render: () => ({
    components: { AdminIcon },
    setup: () => ({ Circle }),
    template: '<AdminIcon :icon="Circle" />',
  }),
};

export const Progress: Story = {
  render: () => ({
    components: { AdminProgress },
    template: '<AdminProgress label="Сохраняем…" />',
  }),
};

export const RadioGroup: Story = {
  render: () => ({
    components: { AdminRadioGroup },
    setup: () => ({
      modelValue: shallowRef("barista"),
      items: [
        { label: "Бариста", value: "barista" },
        { label: "Администратор", value: "administrator" },
      ],
    }),
    template:
      '<AdminRadioGroup v-model="modelValue" aria-label="Роль" :items="items" />',
  }),
};
