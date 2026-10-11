<template>
  <div class="product-workspace__workspace" :class="workspaceClass">
    <section class="product-workspace__list">
      <div class="product-workspace__heading">
        <h2
          id="product-list-heading"
          class="foundation-section-title"
          tabindex="-1"
        >
          Товары
        </h2>
        <UiButton
          v-if="!task"
          :disabled="mutationDisabled"
          @activate="emit('create')"
          >Добавить товар</UiButton
        >
      </div>
      <ProductSearch
        :search="search"
        :category-id="categoryId"
        :categories="data.categories"
        :loading="loading"
        :disabled="findingDisabled"
        :show-refresh="showRefresh"
        @search="emit('search', $event)"
        @category="emit('category', $event)"
        @refresh="emit('refresh')"
      />
      <UiButton
        v-if="canProductReorder"
        variant="quiet"
        class="product-workspace__reorder-entry"
        :disabled="mutationDisabled"
        @activate="emit('reorder')"
        >Изменить порядок</UiButton
      >
      <div
        v-if="visibleProducts.length === 0"
        class="product-workspace__feedback"
      >
        <p>
          {{ productsFiltered ? "Ничего не найдено" : "Товаров пока нет" }}
        </p>
        <UiButton
          v-if="productsFiltered && !task"
          variant="quiet"
          @activate="clearSearch"
          >Сбросить поиск</UiButton
        >
      </div>
      <ProductList
        v-else
        :products="visibleProducts"
        :categories="data.categories"
        :selected-id="selectedId"
        :disabled="selectionDisabled"
        @select="emit('select', $event)"
      />
    </section>
    <section v-if="formTask" class="product-workspace__editor">
      <ProductForm
        :draft="formTask.draft"
        :baseline-choices="baselineChoices"
        :categories="data.categories"
        :errors="errors"
        :title="title"
        :category-name="categoryName"
        :creating="creating"
        :read-only="readOnly"
        :disabled="disabled"
        :mutation-disabled="mutationDisabled"
        :dirty="dirty"
        :busy="busy"
        :attempting="attempting"
        :can-archive="canArchive"
        :confirming="confirming"
        @draft="emit('draft', $event)"
        @mode="emit('mode', $event)"
        @add-choice="emit('addChoice')"
        @remove-choice="emit('removeChoice', $event)"
        @restore-choice="emit('restoreChoice', $event)"
        @move-choice="(key, direction) => emit('moveChoice', key, direction)"
        @save="emit('save')"
        @cancel="emit('cancel')"
        @archive="emit('archive')"
      />
      <div v-if="showCurrent" class="product-workspace__feedback">
        <h3>Текущий товар</h3>
        <template v-if="currentProduct">
          <p>{{ currentProduct.name }} · {{ currentCategoryName }}</p>
          <p class="product-workspace__description">
            {{ currentProduct.description }}
          </p>
          <p>
            {{
              currentProduct.price === null
                ? "Ценовые опции"
                : `${currentProduct.price} ₽`
            }}
            · Порядок {{ currentProduct.sortOrder }}
          </p>
          <ul v-if="currentProduct.priceChoices.length">
            <li v-for="choice in currentProduct.priceChoices" :key="choice.id">
              {{ choice.portionLabel }} · {{ choice.price }} ₽ · Порядок
              {{ choice.sortOrder }} ·
              {{ choice.isAvailable ? "Доступна" : "Недоступна" }}
            </li>
          </ul>
        </template>
        <p v-else>Товар недоступен</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ProductForm from "../../features/product-edit/ProductForm.vue";
import ProductSearch from "../../features/product-search/ProductSearch.vue";
import ProductList from "./ProductList.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ProductWorkspaceProps,
  ProductWorkspaceEmits,
} from "./ProductWorkspace.types";

const props = defineProps<ProductWorkspaceProps>();
const emit = defineEmits<ProductWorkspaceEmits>();
const formTask = computed(() =>
  props.task !== null && props.task.kind !== "product-reorder"
    ? props.task
    : null,
);
const selectedId = computed(() =>
  formTask.value?.kind === "product-edit" ? formTask.value.baseline.id : null,
);
const title = computed(() =>
  formTask.value?.kind === "product-edit"
    ? formTask.value.baseline.name
    : "Новый товар",
);
const categoryName = computed(() =>
  formTask.value?.kind === "product-edit" ? formTask.value.category.name : "",
);
const baselineChoices = computed(() =>
  formTask.value?.kind === "product-edit"
    ? formTask.value.baseline.priceChoices
    : [],
);
const creating = computed(() => formTask.value?.kind === "product-create");
const productsFiltered = computed(
  () => props.search.trim() !== "" || props.categoryId !== "",
);
const visibleProducts = computed(() => {
  const query = props.search.trim().toLocaleLowerCase("ru-RU");

  return props.data.products.filter(
    (item) =>
      (props.categoryId === "" || item.categoryId === props.categoryId) &&
      item.name.toLocaleLowerCase("ru-RU").includes(query),
  );
});
const findingDisabled = computed(() => props.disabled || props.task !== null);
const selectionDisabled = computed(
  () => props.mutationDisabled || props.task !== null,
);
const canProductReorder = computed(
  () =>
    props.task === null &&
    props.categoryId !== "" &&
    props.data.products.filter((item) => item.categoryId === props.categoryId)
      .length > 1,
);
const canArchive = computed(
  () =>
    formTask.value?.kind === "product-edit" &&
    !props.dirty &&
    !props.mutationDisabled,
);
const showCurrent = computed(
  () => selectedId.value !== null && props.reconciled,
);
const currentProduct = computed(() =>
  props.data.products.find((item) => item.id === selectedId.value),
);
const currentCategoryName = computed(
  () =>
    props.data.categories.find(
      (item) => item.id === currentProduct.value?.categoryId,
    )?.name,
);
const workspaceClass = computed(() => ({
  "product-workspace__workspace--editing": formTask.value !== null,
  "product-workspace__workspace--current": props.reconciled,
}));

function clearSearch() {
  emit("search", "");
  emit("category", "");
}
</script>

<style scoped>
.product-workspace__workspace,
.product-workspace__list,
.product-workspace__editor {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.product-workspace__heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
}
.product-workspace__feedback {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  overflow-wrap: anywhere;
}
.product-workspace__description {
  white-space: pre-wrap;
}
.product-workspace__reorder-entry {
  justify-self: start;
}
@media (max-width: 63.999rem) {
  .product-workspace__workspace--editing:not(
      .product-workspace__workspace--current
    )
    > .product-workspace__list {
    display: none;
  }
}
@media (min-width: 64rem) {
  .product-workspace__workspace--editing {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
}
</style>
