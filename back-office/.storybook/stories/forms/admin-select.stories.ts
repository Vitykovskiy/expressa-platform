import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminSelect from "../../../src/shared/ui/admin/admin-select/AdminSelect.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
const meta = {
  title: "Базовые элементы/Список выбора",
  id: "forms-adminselect",
  component: AdminSelect,
  args: {
    modelValue: "barista",
    items: [
      { title: "Бариста", value: "barista" },
      { title: "Администратор", value: "administrator" },
      {
        title:
          "Старший администратор с расширенными правами управления каталогом",
        value: "long",
      },
    ],
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminFieldWrapper, AdminSelect },
    setup: () => {
      const value = shallowRef(args.modelValue);
      return {
        args,
        value,
      };
    },
    template: `
      <AdminFieldWrapper id="role" label="Роль пользователя" v-slot="field">
          <AdminSelect
            :id="field.controlId"
            v-bind="args"
            :model-value="value"
            @update:model-value="value = $event"
          />
      </AdminFieldWrapper>
    `,
  };
}
export const Selected: Story = { name: "Выбрано", render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
export const LongOption: Story = {
  name: "Длинный вариант",
  args: { modelValue: "long" },
  render,
};
