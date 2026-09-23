import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminSelect from "../../../src/shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminTextarea from "../../../src/shared/ui/admin/admin-textarea/AdminTextarea.vue";

const meta = {
  title: "Forms/AdminFieldWrapper",
  component: AdminFieldWrapper,
  args: { id: "product-name", label: "Название товара" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderText(args: Story["args"]) {
  return {
    components: { AdminFieldWrapper, AdminTextField },
    setup: () => ({ args }),
    template: `
      <AdminFieldWrapper v-bind="args" v-slot="field">
          <AdminTextField
            :id="field.controlId"
            :required="field.required"
            model-value="Капучино"
          />
      </AdminFieldWrapper>
    `,
  };
}

export const Required: Story = { args: { required: true }, render: renderText };
export const Optional: Story = { render: renderText };
export const Error: Story = {
  args: {
    error: "Название должно содержать не более 120 символов.",
    required: true,
  },
  render: renderText,
};
export const TableError: Story = {
  args: {
    error: "Укажите цену в целых рублях",
    label: "Цена варианта 1",
    layout: "table",
    required: true,
  },
  render(args: Story["args"]) {
    return {
      components: { AdminFieldWrapper, AdminTextField },
      setup: () => ({ args }),
      template: `
        <div>
          <span>Цена, ₽</span>
          <AdminFieldWrapper v-bind="args" v-slot="field">
            <AdminTextField
              :id="field.controlId"
              :required="field.required"
              model-value=""
            />
          </AdminFieldWrapper>
        </div>
      `,
    };
  },
};
export const Disabled: Story = {
  render(args: Story["args"]) {
    return {
      components: { AdminFieldWrapper, AdminTextField },
      setup: () => ({ args }),
      template: `
        <AdminFieldWrapper v-bind="args" v-slot="field">
            <AdminTextField :id="field.controlId" disabled model-value="Капучино" />
        </AdminFieldWrapper>
      `,
    };
  },
};
export const LongLabel: Story = {
  args: {
    label:
      "Название позиции, которое будет отображаться в списке доступных товаров",
  },
  render: renderText,
};
export const Select: Story = {
  render(args: Story["args"]) {
    return {
      components: { AdminFieldWrapper, AdminSelect },
      setup: () => ({ args, value: shallowRef("barista") }),
      template: `
        <AdminFieldWrapper v-bind="args" v-slot="field">
            <AdminSelect
              :id="field.controlId"
              v-model="value"
              :items="[
                { title: 'Бариста', value: 'barista' },
                { title: 'Администратор', value: 'administrator' },
              ]"
            />
        </AdminFieldWrapper>
      `,
    };
  },
};
export const Textarea: Story = {
  render(args: Story["args"]) {
    return {
      components: { AdminFieldWrapper, AdminTextarea },
      setup: () => ({ args }),
      template: `
        <AdminFieldWrapper v-bind="args" v-slot="field">
            <AdminTextarea :id="field.controlId" model-value="Описание напитка" />
        </AdminFieldWrapper>
      `,
    };
  },
};
