import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminSelect from "../../../src/shared/ui/admin/admin-select/AdminSelect.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
const meta = {
  title: "Forms/AdminSelect",
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
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            :model-value="value"
            @update:model-value="value = $event"
          />
      </AdminFieldWrapper>
    `,
  };
}
export const Selected: Story = { render };
export const Disabled: Story = { args: { disabled: true }, render };
export const LongOption: Story = { args: { modelValue: "long" }, render };
export const OpenKeyboard: Story = { render };
