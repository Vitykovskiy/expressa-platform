import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import CategoryForm from "../../../components/domain-ui/Menu/CategoryForm.vue";
import CategoryListItem from "../../../components/domain-ui/Menu/CategoryListItem.vue";
import ModifierGroupEditor from "../../../components/domain-ui/Menu/ModifierGroupEditor.vue";
import ModifierOptionEditor from "../../../components/domain-ui/Menu/ModifierOptionEditor.vue";
import ProductForm from "../../../components/domain-ui/Menu/ProductForm.vue";
import ProductListItem from "../../../components/domain-ui/Menu/ProductListItem.vue";
const backOfficeViewports = Object.fromEntries(
  [479, 480, 767, 768, 1023, 1024, 1280, 1440].map((width) => [
    `width${width}`,
    {
      name: `${width} px`,
      styles: { width: `${width}px`, height: "900px" },
      type: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    },
  ]),
);
const meta = {
  title: "Menu/Canonical",
  component: ProductForm,
  parameters: {
    viewport: { defaultViewport: "width1280", viewports: backOfficeViewports },
  },
} satisfies Meta<typeof ProductForm>;
export default meta;
type Story = StoryObj;
const category = { id: "coffee", name: "Кофе", active: true, archived: false };
export const DrinksPricesAndModifiers: Story = {
  render: () => ({
    components: {
      CategoryListItem,
      ProductListItem,
      CategoryForm,
      ProductForm,
      ModifierGroupEditor,
      ModifierOptionEditor,
    },
    setup() {
      const saved = ref(false);
      const opened = ref("");
      return { category, saved, opened, save: () => (saved.value = true) };
    },
    template: `<section><CategoryListItem :category="category" @open="opened='Категория '+$event"/><ProductListItem :product="{id:'latte',name:'Латте',active:true,archived:false}" @open="opened='Товар '+$event"/><p v-if="opened" role="status">Открыт редактор: {{ opened }}</p><CategoryForm :initial="{name:'Кофе',active:true}" @save="save"/><ProductForm :initial="{name:'Капучино',kind:'drink',price:'',variants:{S:250,M:320,L:390}}" @save="save"/><ProductForm :initial="{name:'Эспрессо',kind:'drink',price:'',variants:{S:180}}" @save="save"/><ProductForm :initial="{name:'Печенье',kind:'single',price:'120',variants:{}}" @save="save"/><ModifierGroupEditor :initial="{name:'Молоко',categoryId:'coffee',required:true,mode:'single',min:'1',max:'1'}" :categories="[category]" @save="save"/><ModifierOptionEditor :initial="{id:'oat',name:'Овсяное',price:'50',defaultFree:false}" @save="save"/><p v-if="saved" role="status">Сохранено</p></section>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const categoryButton = canvas.getByRole("button", { name: /Кофе/ });
    await userEvent.tab();
    await expect(categoryButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByText("Открыт редактор: Категория coffee"),
    ).toBeVisible();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByText("Открыт редактор: Товар latte"),
    ).toBeVisible();
    await expect(canvas.getAllByLabelText("Цена S")[0]).toHaveValue(250);
    const name = canvas.getAllByRole("textbox", {
      name: "Название категории",
    })[0];
    await userEvent.clear(name);
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить категорию" }),
    );
    await expect(name).toHaveValue("");
  },
};
export const ServerFieldErrorPreservesInput: Story = {
  render: () => ({
    components: { ProductForm },
    setup() {
      const saved = ref(false);
      return { saved, save: () => (saved.value = true) };
    },
    template: `<section><ProductForm :initial="{name:'Латте',kind:'single',price:'300',variants:{}}" :server-errors="{name:'Такое название уже есть'}" @save="save"/><p v-if="saved" role="status">Сохранено после исправления</p></section>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("textbox", { name: "Название товара" }),
    ).toHaveValue("Латте");
    await expect(canvas.getByRole("textbox", { name: "Цена" })).toHaveValue(
      "300",
    );
    await expect(
      canvas.getAllByText("name: Такое название уже есть")[0],
    ).toBeVisible();
    const name = canvas.getByRole("textbox", { name: "Название товара" });
    await userEvent.clear(name);
    await userEvent.type(name, "Латте 2");
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить товар" }),
    );
    await expect(canvas.getByText("Сохранено после исправления")).toBeVisible();
  },
};
