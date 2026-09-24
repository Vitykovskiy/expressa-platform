<template>
  <PageShell class="product-edit-page">
    <section v-if="!loaded" class="product-edit-page__missing">
      Загружаем товар…
    </section>
    <ProductEditContent
      v-else-if="product"
      v-model:name="name"
      v-model:category-id="categoryId"
      v-model:description="description"
      v-model:choices="choices"
      v-model:is-active="isActive"
      :category-options="categoryOptions"
      :choice-errors="choiceErrors"
      :description-error="descriptionError"
      :dirty="dirty"
      :name-error="nameError"
      :pending="pending"
      :saved="saved"
      :valid="valid"
      @archive="archiveOpen = true"
      @back="cancel"
      @cancel="cancel"
      @save="save"
    />
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
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useSessionStore } from "../app/session.store";
import AdminButton from "../shared/ui/admin/admin-button/AdminButton.vue";
import ConfirmDialog from "../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import ProductEditContent from "./admin/menu/product-edit/ProductEditContent.vue";
import {
  productNameError,
  productDescriptionError,
  productChoiceErrors,
  productErrorMessages,
} from "./admin/menu/product-edit/ProductEdit.validation";
import { priceChoiceDrafts } from "./admin/menu/product-edit/useProductDraft";
import type { ProductPriceChoiceDraft } from "./admin/menu/product-edit/useProductDraft.types";
import { useCatalogStore } from "./admin/menu/catalog.store";
import PageShell from "./PageShell.vue";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const catalogStore = useCatalogStore();
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
.product-edit-page__missing {
  max-width: var(--expressa-size-users-content-max-width);
  margin: auto;
  padding: var(--expressa-space-xl);
  display: grid;
  gap: var(--expressa-space-md);
}
@media (max-width: 599px) {
  .product-edit-page__missing {
    padding: var(--expressa-space-16);
  }
}
</style>
