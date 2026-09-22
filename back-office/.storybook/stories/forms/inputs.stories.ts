import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";

const meta = {
  title: "Forms/AdminTextField",
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
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          :model-value="modelValue"
          @update:model-value="modelValue = $event"
        />
      </AdminFieldWrapper>
    `,
  };
}

export const Filled: Story = { args: { modelValue: "Капучино" }, render };
export const Empty: Story = {
  args: { modelValue: "" },
  render,
};
export const Disabled: Story = {
  args: { modelValue: "Капучино", disabled: true },
  render,
};
