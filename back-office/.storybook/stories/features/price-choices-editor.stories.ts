import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PriceChoicesEditor from "../../../src/pages/admin/menu/product-edit/PriceChoicesEditor.vue";
import { computed, shallowRef } from "vue";
import ProductEditContent from "../../../src/pages/admin/menu/product-edit/ProductEditContent.vue";
import ConfirmDialog from "../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import PageShell from "../../../src/pages/PageShell.vue";
import { createNavigationItems } from "../../../src/app/navigation";
import { category, product } from "../../fixtures/catalog";
const meta = {
  title: "Бизнес компоненты/Меню/Список вариантов цены",
  id: "features-menu-pricechoiceseditor",
  component: PriceChoicesEditor,
} satisfies Meta<typeof PriceChoicesEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { PriceChoicesEditor },
    setup: () => ({
      args,
      choices: shallowRef([
        {
          clientId: "choice-1",
          id: "small",
          portionLabel: "300 мл",
          price: "290",
          isAvailable: true,
        },
      ]),
    }),
    template: '<PriceChoicesEditor v-bind="args" v-model="choices" />',
  };
}
export const List: Story = { name: "Список", render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
function productComposition(args: Story["args"]) {
  return {
    components: { AdminShell, PageShell, ProductEditContent, ConfirmDialog },
    setup: () => {
      const name = shallowRef(product.name);
      const categoryId = shallowRef(product.categoryId);
      const description = shallowRef(product.description);
      const isActive = shallowRef(product.isActive);
      const choices = shallowRef([
        {
          clientId: "small",
          id: "small",
          portionLabel: "300 мл",
          price: "290",
          isAvailable: true,
        },
        {
          clientId: "large",
          id: "large",
          portionLabel: "450 мл",
          price: "390",
          isAvailable: true,
        },
      ]);
      const baseline = JSON.stringify({
        name: name.value,
        categoryId: categoryId.value,
        description: description.value,
        isActive: isActive.value,
        choices: choices.value,
      });
      const dirty = computed(
        () =>
          JSON.stringify({
            name: name.value,
            categoryId: categoryId.value,
            description: description.value,
            isActive: isActive.value,
            choices: choices.value,
          }) !== baseline,
      );
      const archiveOpen = shallowRef(false);
      const discardOpen = shallowRef(false);
      function cancel() {
        if (dirty.value) discardOpen.value = true;
      }
      return {
        args,
        name,
        categoryId,
        description,
        isActive,
        choices,
        dirty,
        archiveOpen,
        discardOpen,
        cancel,
        product,
        category,
        items: createNavigationItems("administrator"),
      };
    },
    template: `<AdminShell role="administrator" active-section="menu" :items="items"><PageShell class="product-edit-page">
      <ProductEditContent v-model:name="name" v-model:category-id="categoryId" v-model:description="description" v-model:is-active="isActive" v-model:choices="choices"
        :category-options="[{ id: category.id, label: category.name }]" :choice-errors="{}" description-error="" name-error="" :dirty="dirty" :pending="Boolean(args.disabled)" :saved="false" :valid="true"
        @archive="archiveOpen = true" @cancel="cancel" @back="cancel" />
      <ConfirmDialog v-model:open="archiveOpen" confirm-label="Архивировать товар" confirm-variant="destructive"
        :pending="Boolean(args.disabled)" :title="'Архивировать товар «' + product.name + '»?'" :description="'Товар «' + product.name + '» будет скрыт из меню. История заказов сохранится.'" />
      <ConfirmDialog v-model:open="discardOpen" cancel-label="Вернуться" confirm-label="Выйти" confirm-variant="destructive"
        description="Несохранённые изменения будут потеряны." title="Выйти без сохранения?" />
    </PageShell></AdminShell>`,
  };
}
export const ProductComposition: Story = {
  name: "Сохранённые цены в редакторе товара",
  parameters: { layout: "fullscreen" },
  render: productComposition,
};
export const ProductCompositionPending: Story = {
  name: "Редактор товара недоступен",
  args: { disabled: true },
  parameters: { layout: "fullscreen" },
  render: productComposition,
};
