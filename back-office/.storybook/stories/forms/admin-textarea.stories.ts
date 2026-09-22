import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminTextarea from "../../../src/shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";

const meta = {
  title: "Forms/AdminTextarea",
  component: AdminTextarea,
  args: { modelValue: "Описание напитка" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminFieldWrapper, AdminTextarea },
    setup: () => ({ args, modelValue: shallowRef(args.modelValue) }),
    template: `
      <AdminFieldWrapper id="description" label="Описание" v-slot="field">
        <AdminTextarea
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

export const Filled: Story = { render };
export const Empty: Story = {
  args: { modelValue: "" },
  render,
};
export const Disabled: Story = { args: { disabled: true }, render };
