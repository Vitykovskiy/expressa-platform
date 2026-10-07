import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
  title: "Бизнес компоненты/Меню/Редактор группы добавок",
  id: "features-menu-modifiergroupeditor",
  component: ModifierGroupEditor,
  args: { group: modifierGroup },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModifierGroupEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function createRender(args: Story["args"]) {
  return {
    components: { ModifierGroupEditor },
    setup: () => ({ args }),
    template: '<ModifierGroupEditor v-bind="args" />',
  };
}
export const Existing: Story = {
  name: "Существующая группа",
  args: { group: modifierGroupWithOptions },
  render: (args) => createRender(args),
};
export const New: Story = {
  name: "Новая группа",
  args: { group: null },
  render: (args) => createRender(args),
};
export const PendingLocked: Story = {
  name: "Ожидание без редактирования",
  args: { pendingMessage: "Сохраняем…", disabled: true },
  render: (args) => createRender(args),
};
export const Validation: Story = {
  name: "Ошибки ввода",
  args: {
    fieldErrors: {
      name: "Введите название группы",
      minSelect: "Минимум не может быть больше максимума",
      "options.0.name": "Введите название варианта",
    },
  },
  render: (args) => createRender(args),
};
