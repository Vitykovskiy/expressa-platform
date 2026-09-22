import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import ModifierGroupEditor from "../../../src/pages/admin/menu/ModifierGroupEditor.vue";
import { modifierGroup } from "../../fixtures/catalog";

const modifierGroupWithOptions = {
  ...modifierGroup,
  name: "Добавки",
  options: [
    {
      ...modifierGroup.options[0],
      id: "first",
      name: "Первый",
      sortOrder: 0,
    },
    {
      ...modifierGroup.options[0],
      id: "second",
      name: "Второй",
      sortOrder: 1,
    },
    {
      ...modifierGroup.options[0],
      id: "third",
      name: "Третий",
      sortOrder: 2,
    },
  ],
};
const meta = {
  title: "Features/Menu/ModifierGroupEditor",
  component: ModifierGroupEditor,
  args: { group: modifierGroup },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModifierGroupEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function createRender(args: Story["args"]) {
  return {
    components: { ModifierGroupEditor },
    setup: () => {
      const saveOutcome = shallowRef(args.saveOutcome ?? "idle");
      return {
        args,
        saveOutcome,
        save: () => {
          saveOutcome.value = "saved";
        },
        archive: () => {
          saveOutcome.value = "saved";
        },
      };
    },
    template:
      '<ModifierGroupEditor v-bind="args" :save-outcome="saveOutcome" @archive="archive" @save="save" />',
  };
}
export const Existing: Story = {
  args: { group: modifierGroupWithOptions },
  render: (args) => createRender(args),
};
export const New: Story = {
  args: { group: null },
  render: (args) => createRender(args),
};
export const PendingLocked: Story = {
  args: { pendingMessage: "Сохраняем…", disabled: true },
  render: (args) => createRender(args),
};
export const Validation: Story = {
  args: {
    fieldErrors: {
      name: "Введите название группы",
      minSelect: "Минимум не может быть больше максимума",
      "options.0.name": "Введите название варианта",
    },
  },
  render: (args) => createRender(args),
};
