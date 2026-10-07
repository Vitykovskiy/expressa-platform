import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import CategoryFormFields from "../../../src/pages/admin/menu/CategoryFormFields.vue";
const meta = {
  title: "Бизнес компоненты/Меню/Поля категории",
  id: "forms-categoryformfields",
  component: CategoryFormFields,
  args: {
    name: "Кофе",
    description: "Классика",
    isActive: true,
    disabled: false,
    errors: {},
  },
} satisfies Meta<typeof CategoryFormFields>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { CategoryFormFields },
    setup: () => {
      const name = shallowRef(args.name);
      const description = shallowRef(args.description);
      const isActive = shallowRef(args.isActive);
      return { args, name, description, isActive };
    },
    template: `
      <CategoryFormFields
        v-bind="args"
        :description="description"
        :is-active="isActive"
        :name="name"
        @update:description="description = $event"
        @update:is-active="isActive = $event"
        @update:name="name = $event"
      />
    `,
  };
}
export const Filled: Story = { name: "Заполнено", render };
export const Validation: Story = {
  name: "Ошибки ввода",
  args: { errors: { name: "Такое название уже есть" } },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
