<template>
  <PageShell class="product-edit-page">
    <section v-if="!loaded" class="product-edit-page__missing">
      Загружаем товар…
    </section>
    <main v-else-if="product" class="product-edit-page__main">
      <nav>
        <RouterLink to="/menu">Меню</RouterLink><span> / </span
        ><span>Редактировать товар</span>
      </nav>
      <h1>Редактировать товар</h1>
      <section
        v-if="errorMessages.length"
        class="product-edit-page__validation"
      >
        <h2>Проверьте данные</h2>
        <ul>
          <li v-for="message in errorMessages" :key="message">{{ message }}</li>
        </ul>
      </section>
      <p v-if="saved">Товар сохранён</p>
      <ProductEditForm
        :dirty="dirty"
        :pending="pending"
        :valid="valid"
        @cancel="cancel"
        @save="save"
      >
        <AdminFieldWrapper
          :id="nameFieldId"
          v-slot="field"
          label="Название товара"
          required
        >
          <AdminTextField
            :id="field.controlId"
            v-model="name"
            :disabled="pending"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <AdminFieldWrapper
          :id="categoryFieldId"
          v-slot="field"
          label="Категория"
          required
        >
          <AdminCombobox
            :id="field.controlId"
            v-model="categoryId"
            :options="categoryOptions"
            :disabled="pending"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <AdminFieldWrapper
          :id="descriptionFieldId"
          v-slot="field"
          :error="descriptionError"
          label="Описание"
        >
          <AdminTextarea
            :id="field.controlId"
            v-model="description"
            class="product-edit-page__description"
            :disabled="pending"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <section class="product-edit-page__section">
          <h2>Цены и порции</h2>
          <PriceChoicesEditor
            v-model="choices"
            :disabled="pending"
            :errors="choiceErrors"
          />
        </section>
        <section class="product-edit-page__section">
          <h2>Публикация</h2>
          <div class="product-edit-page__toggle">
            <strong :id="publicationLabelId">Показывать в меню</strong
            ><AdminToggle v-model="isActive" :disabled="pending" />
          </div>
        </section>
        <section class="product-edit-page__archive">
          <h2>Архив</h2>
          <AdminButton
            :disabled="pending"
            type="button"
            variant="destructive"
            @click="archiveOpen = true"
            >Архивировать товар</AdminButton
          >
        </section>
      </ProductEditForm>
    </main>
    <section v-else class="product-edit-page__missing">
      <h1>Товар не найден</h1>
      <p>Товар мог быть удалён или перемещён.</p>
      <AdminButton type="button" @click="reload">Загрузить меню</AdminButton
      ><RouterLink to="/menu">Вернуться в меню</RouterLink>
    </section>
    <ConfirmDialog
      v-model:open="archiveOpen"
      confirm-label="Архивировать товар"
      confirm-variant="destructive"
      :description="`Товар «${product?.name ?? ''}» будет скрыт из меню. История заказов сохранится.`"
      :pending="pending"
      :title="`Архивировать товар «${product?.name ?? ''}»?`"
      @confirm="archive"
    />
    <ConfirmDialog
      v-model:open="discardOpen"
      cancel-label="Вернуться"
      confirm-label="Выйти"
      confirm-variant="destructive"
      :description="'Несохранённые изменения будут потеряны.'"
      title="Выйти без сохранения?"
      @confirm="confirmDiscard"
    />
  </PageShell>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  useId,
} from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useSessionStore } from "../app/session.store";
import AdminButton from "../shared/ui/admin/admin-button/AdminButton.vue";
import AdminCombobox from "../shared/ui/admin/admin-combobox/AdminCombobox.vue";
import AdminFieldWrapper from "../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextarea from "../shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminTextField from "../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../shared/ui/admin/admin-toggle/AdminToggle.vue";
import ConfirmDialog from "../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import PriceChoicesEditor from "./admin/menu/product-edit/PriceChoicesEditor.vue";
import ProductEditForm from "./admin/menu/product-edit/ProductEditForm.vue";
import { priceChoiceDrafts } from "./admin/menu/product-edit/useProductDraft";
import type { ProductPriceChoiceDraft } from "./admin/menu/product-edit/useProductDraft.types";
import { useCatalogStore } from "./admin/menu/catalog.store";
import PageShell from "./PageShell.vue";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const catalogStore = useCatalogStore();
const publicationLabelId = `product-publication-${useId()}`;
const nameFieldId = `product-name-${useId()}`;
const categoryFieldId = `product-category-${useId()}`;
const descriptionFieldId = `product-description-${useId()}`;
const pending = shallowRef(false);
const loaded = shallowRef(false);
const archiveOpen = shallowRef(false);
const discardOpen = shallowRef(false);
const discardTarget = shallowRef<string | null>(null);
const saved = shallowRef(false);
const product = computed(() =>
  catalogStore.products.find((item) => item.id === route.params.productId),
);
const categoryOptions = computed(() =>
  catalogStore.categories.map((category) => ({
    id: category.id,
    label: category.name,
  })),
);
const name = shallowRef("");
const categoryId = shallowRef("");
const description = shallowRef("");
const isActive = shallowRef(true);
const choices = shallowRef<ProductPriceChoiceDraft[]>([]);
const baseline = shallowRef("");
const descriptionError = computed(() =>
  description.value.trim().length > 240
    ? "Описание должно быть не длиннее 240 символов"
    : "",
);
const choiceErrors = computed<
  Readonly<Record<string, { price?: string; portionLabel?: string }>>
>(() => {
  const errors: Record<string, { price?: string; portionLabel?: string }> = {};
  const labels = new Map<string, string>();
  for (const choice of choices.value) {
    const entry: { price?: string; portionLabel?: string } = {};
    if (!/^\d+$/.test(choice.price) || Number(choice.price) < 0)
      entry.price = "Введите целое неотрицательное значение";
    const normalized = choice.portionLabel
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("ru");
    if (choices.value.length > 1 && !normalized)
      entry.portionLabel = "Укажите подпись варианта";
    else if (normalized && labels.has(normalized)) {
      entry.portionLabel = "Подписи вариантов не должны повторяться";
      const first = labels.get(normalized);
      if (first && !errors[first]?.portionLabel)
        errors[first] = {
          ...errors[first],
          portionLabel: "Подписи вариантов не должны повторяться",
        };
    } else if (normalized) labels.set(normalized, choice.clientId);
    if (Object.keys(entry).length) errors[choice.clientId] = entry;
  }
  return errors;
});
const errorMessages = computed(() => [
  ...(name.value.trim().length === 0 ? ["Укажите название товара"] : []),
  ...(name.value.trim().length > 120
    ? ["Название должно содержать не более 120 символов"]
    : []),
  ...(descriptionError.value ? [descriptionError.value] : []),
  ...(choices.value.length === 0 ? ["Добавьте хотя бы один вариант"] : []),
  ...Object.values(choiceErrors.value).flatMap((entry) =>
    Object.values(entry).filter((message): message is string =>
      Boolean(message),
    ),
  ),
]);
const valid = computed(() => errorMessages.value.length === 0);
const snapshot = computed(() =>
  JSON.stringify({
    name: name.value.trim(),
    categoryId: categoryId.value,
    description: description.value.trim(),
    isActive: isActive.value,
    choices: choices.value,
  }),
);
const dirty = computed(() => snapshot.value !== baseline.value);
function fill(): void {
  const item = product.value;
  if (!item) return;
  name.value = item.name;
  categoryId.value = item.categoryId;
  description.value = item.description;
  isActive.value = item.isActive;
  choices.value = priceChoiceDrafts(item.priceChoices ?? [], item);
  baseline.value = snapshot.value;
}
async function reload(): Promise<void> {
  if (session.accessToken) await catalogStore.load(session.accessToken);
}
async function save(): Promise<void> {
  const item = product.value;
  if (!item || !session.accessToken || pending.value || !valid.value) return;
  pending.value = true;
  await catalogStore.updateProduct(session.accessToken, item.id, {
    categoryId: categoryId.value,
    name: name.value.trim(),
    description: description.value.trim(),
    isActive: isActive.value,
    isAvailable: item.isAvailable,
    price: choices.value.length === 1 ? Number(choices.value[0]!.price) : null,
    portionLabel:
      choices.value.length === 1
        ? choices.value[0]!.portionLabel || null
        : null,
    priceChoices:
      choices.value.length > 1
        ? choices.value.map((choice, index) => ({
            id: choice.id,
            portionLabel: choice.portionLabel,
            price: Number(choice.price),
            isAvailable: choice.isAvailable,
            sortOrder: index,
          }))
        : [],
    sortOrder: item.sortOrder,
  });
  pending.value = false;
  if (catalogStore.lastCommandSucceeded) {
    baseline.value = snapshot.value;
    saved.value = true;
  }
}
async function archive(): Promise<void> {
  const item = product.value;
  if (!item || !session.accessToken || pending.value) return;
  pending.value = true;
  await catalogStore.archiveProduct(session.accessToken, item.id);
  pending.value = false;
  if (catalogStore.lastCommandSucceeded) await router.push("/menu");
}
async function cancel(): Promise<void> {
  const target = "/menu";
  if (dirty.value) {
    discardTarget.value = target;
    discardOpen.value = true;
    return;
  }
  await router.push(target);
}
async function confirmDiscard(): Promise<void> {
  const target = discardTarget.value ?? "/menu";
  discardTarget.value = null;
  baseline.value = snapshot.value;
  await router.push(target);
}
onBeforeRouteLeave((to) => {
  if (!dirty.value) return true;
  discardTarget.value = to.fullPath;
  discardOpen.value = true;
  return false;
});
onMounted(async () => {
  await reload();
  fill();
  loaded.value = true;
});
watch(product, fill);
watch(snapshot, () => {
  if (saved.value && dirty.value) saved.value = false;
});
function warnBeforeUnload(event: BeforeUnloadEvent): void {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = "";
}
globalThis.addEventListener?.("beforeunload", warnBeforeUnload);
onBeforeUnmount(() =>
  globalThis.removeEventListener?.("beforeunload", warnBeforeUnload),
);
</script>
<style scoped lang="scss">
.product-edit-page__main {
  width: 100%;
  max-width: var(--expressa-size-users-content-max-width);
  margin: auto;
  padding: var(--expressa-space-xl);
}
.product-edit-page__field,
.product-edit-page__section {
  display: grid;
  gap: var(--expressa-space-sm);
}
.product-edit-page__field span {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
}
.product-edit-page__description {
  min-height: var(--expressa-size-textarea-min-height);
}
.product-edit-page__toggle {
  display: flex;
  justify-content: space-between;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
}
.product-edit-page__archive {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  padding-top: var(--expressa-space-lg);
}
.product-edit-page__missing {
  max-width: var(--expressa-size-users-content-max-width);
  margin: auto;
  padding: var(--expressa-space-xl);
  display: grid;
  gap: var(--expressa-space-md);
}
@media (max-width: 599px) {
  .product-edit-page__main,
  .product-edit-page__missing {
    padding: var(--expressa-space-16);
  }
}
</style>
