import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import ProductEditForm from "../../../src/pages/admin/menu/product-edit/ProductEditForm.vue";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../src/shared/ui/admin/admin-toggle/AdminToggle.vue";
import AdminFieldWrapper from "../../../src/shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
const meta = {
  title: "Features/Menu/ProductEditForm",
  component: ProductEditForm,
  args: { dirty: true, valid: true, pending: false },
} satisfies Meta<typeof ProductEditForm>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: {
      AdminFieldWrapper,
      AdminTextField,
      AdminToggle,
      ProductEditForm,
    },
    setup: () => ({
      args,
      name: shallowRef("Капучино"),
      active: shallowRef(true),
    }),
    template: `<ProductEditForm v-bind="args">
          <AdminFieldWrapper id="product-name" label="Название товара" required v-slot="field">
            <AdminTextField
              :id="field.controlId"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              v-model="name"
              :required="field.required"
            />
          </AdminFieldWrapper>
          <AdminFieldWrapper id="product-active" label="Товар доступен" layout="row" v-slot="field">
            <AdminToggle :id="field.controlId" v-model="active" />
          </AdminFieldWrapper>
        </ProductEditForm>`,
  };
}
export const Valid: Story = { render };
export const Pristine: Story = { args: { dirty: false, valid: false }, render };
export const Pending: Story = { args: { pending: true }, render };
