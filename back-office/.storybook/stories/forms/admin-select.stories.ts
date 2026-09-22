import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminSelect from "../../../src/shared/ui/admin/admin-select/AdminSelect.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
const meta = {
  title: "Forms/AdminSelect",
  component: AdminSelect,
  args: { modelValue: "barista" },
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
        update(event: Event) {
          value.value = (event.target as HTMLSelectElement).value;
        },
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
            @change="update"
            @input="update"
            @update:model-value="value = $event"
          >
            <option value="barista">Бариста</option>
            <option value="administrator">Администратор</option>
            <option value="long">Старший администратор с расширенными правами управления каталогом</option>
          </AdminSelect>
      </AdminFieldWrapper>
    `,
  };
}
export const Selected: Story = { render };
export const Disabled: Story = { args: { disabled: true }, render };
export const LongOption: Story = { args: { modelValue: "long" }, render };
export const OpenKeyboard: Story = { render };
