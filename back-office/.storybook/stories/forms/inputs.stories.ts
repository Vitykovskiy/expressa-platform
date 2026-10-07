import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";

const meta = {
  title: "Базовые элементы/Текстовое поле",
  id: "forms-admintextfield",
  component: AdminTextField,
  args: { modelValue: "Капучино" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminTextField>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminFieldWrapper, AdminTextField },
    setup: () => ({ args, modelValue: shallowRef(args.modelValue) }),
    template: `
      <AdminFieldWrapper id="name" label="Название" v-slot="field">
        <AdminTextField
          :id="field.controlId"
          v-bind="args"
          :model-value="modelValue"
          @update:model-value="modelValue = $event"
        />
      </AdminFieldWrapper>
    `,
  };
}

export const Filled: Story = {
  name: "Заполнено",
  args: { modelValue: "Капучино" },
  render,
};
export const Empty: Story = { name: "Пусто", args: { modelValue: "" }, render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { modelValue: "Капучино", disabled: true },
  render,
};
