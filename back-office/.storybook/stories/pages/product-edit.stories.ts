import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import ProductEditContent from "../../../src/pages/admin/menu/product-edit/ProductEditContent.vue";
import ConfirmDialog from "../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import {
  productNameError,
  productDescriptionError,
  productChoiceErrors,
  productErrorMessages,
} from "../../../src/pages/admin/menu/product-edit/ProductEdit.validation";
import { priceChoiceDrafts } from "../../../src/pages/admin/menu/product-edit/useProductDraft";
import PageShell from "../../../src/pages/PageShell.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import { category, product } from "../../fixtures/catalog";

const items = createNavigationItems("administrator");
const meta = {
  title: "Экраны/Редактирование товара",
  id: "screens-product-edit",
  component: ProductEditContent,
  args: {
    name: product.name,
    categoryId: product.categoryId,
    description: product.description,
    choices: priceChoiceDrafts([], product),
    isActive: product.isActive,
    categoryOptions: [{ id: category.id, label: category.name }],
    choiceErrors: {},
    descriptionError: "",
    nameError: "",
    dirty: false,
    pending: false,
    valid: true,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProductEditContent>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: {
      AdminShell,
      ConfirmDialog,
      PageShell,
      ProductEditContent,
    },
    setup: () => {
      const name = shallowRef(args.name);
      const categoryId = shallowRef(args.categoryId);
      const description = shallowRef(args.description);
      const choices = shallowRef(args.choices.map((choice) => ({ ...choice })));
      const isActive = shallowRef(args.isActive);
      const nameError = computed(() => productNameError(name.value));
      const descriptionError = computed(() =>
        productDescriptionError(description.value),
      );
      const choiceErrors = computed(() => productChoiceErrors(choices.value));
      const errorMessages = computed(() =>
        productErrorMessages(
          nameError.value,
          descriptionError.value,
          choices.value,
          choiceErrors.value,
        ),
      );
      const dirty = computed(
        () =>
          args.dirty ||
          name.value !== product.name ||
          categoryId.value !== product.categoryId ||
          description.value !== product.description ||
          isActive.value !== product.isActive ||
          JSON.stringify(choices.value) !== JSON.stringify(args.choices),
      );
      const discardOpen = shallowRef(false);
      const archiveOpen = shallowRef(false);
      function requestBack(): void {
        if (dirty.value) discardOpen.value = true;
      }
      return {
        args,
        items,
        name,
        categoryId,
        description,
        choices,
        isActive,
        nameError,
        descriptionError,
        choiceErrors,
        errorMessages,
        dirty,
        valid: computed(() => errorMessages.value.length === 0),
        discardOpen,
        archiveOpen,
        product,
        requestBack,
      };
    },
    template: `<AdminShell role="administrator" active-section="menu" :items="items">
      <PageShell class="product-edit-page" content-spacing="none"><ProductEditContent v-bind="args" v-model:name="name" v-model:category-id="categoryId"
        v-model:description="description" v-model:choices="choices" v-model:is-active="isActive"
        :name-error="nameError" :description-error="descriptionError" :choice-errors="choiceErrors"
        :dirty="dirty" :valid="valid" @back="requestBack" @cancel="requestBack" @archive="archiveOpen = true" />
        <ConfirmDialog v-model:open="archiveOpen" confirm-label="Архивировать товар"
          confirm-variant="destructive" :pending="args.pending"
          :description="'Товар «' + product.name + '» будет скрыт из меню. История заказов сохранится.'"
          :title="'Архивировать товар «' + product.name + '»?'" />
        <ConfirmDialog v-model:open="discardOpen" cancel-label="Вернуться" confirm-label="Выйти"
          confirm-variant="destructive" description="Несохранённые изменения будут потеряны."
          title="Выйти без сохранения?" />
      </PageShell>
    </AdminShell>`,
  };
}
export const Ready: Story = {
  name: "Готово",
  render,
};
export const ReadyMobile: Story = {
  name: "Мобильный вид",
  render,
  globals: { viewport: "mobile" },
};
export const Validation: Story = {
  name: "Ошибки ввода",
  render,
  args: { name: "" },
};
export const Changed: Story = {
  name: "Изменено",
  render,
  args: { name: "Капучино большой" },
};
export const AbsentPrice: Story = {
  name: "Цена не указана",
  render,
  args: {
    choices: priceChoiceDrafts([], { ...product, price: null }),
    valid: false,
  },
};
export const AvailabilityDraft: Story = {
  name: "Изменена доступность одной цены",
  render,
  args: {
    choices: priceChoiceDrafts([], { ...product, isAvailable: false }),
    dirty: true,
  },
};
export const Pending: Story = {
  name: "Ожидание операции",
  render,
  args: {
    name: "Капучино большой",
    pending: true,
    choices: [
      {
        clientId: "pending-large",
        portionLabel: "ОченьДлинноеНазваниеПорцииБезПробелов500мл",
        price: "123456789012345678901234567890",
        isAvailable: false,
      },
    ],
  },
};
export const LongChoices: Story = {
  name: "Длинные названия порций",
  render,
  args: {
    categoryOptions: [
      {
        id: category.id,
        label: "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиКонтейнера",
      },
    ],
    choices: [
      {
        clientId: "small",
        portionLabel: "Маленькая порция 200 мл",
        price: "180",
        isAvailable: true,
      },
      {
        clientId: "medium",
        portionLabel: "Средняя порция 300 мл",
        price: "220",
        isAvailable: true,
      },
      {
        clientId: "large",
        portionLabel: "Большая порция 400 мл",
        price: "260",
        isAvailable: false,
      },
      {
        clientId: "extra",
        portionLabel: "Очень длинное название варианта порции 500 мл",
        price: "320",
        isAvailable: true,
      },
    ],
  },
};
