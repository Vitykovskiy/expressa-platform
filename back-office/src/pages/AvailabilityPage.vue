<template>
  <main class="availability-page">
    <div v-if="navigationError" class="availability-page__feedback">
      <p role="alert">{{ navigationError }}</p>
      <UiButton variant="secondary" @activate="emit('resetAddress')"
        >Исправить адрес</UiButton
      >
    </div>
    <template v-else>
      <p v-if="initialLoading" role="status">Загружаем доступность</p>
      <div v-else-if="initialFailure" class="availability-page__feedback">
        <p role="alert">{{ availability.error }}</p>
        <UiButton
          variant="secondary"
          :loading="availability.loading"
          :disabled="session.busy"
          @activate="availability.refresh"
          >Повторить</UiButton
        >
      </div>
      <template v-if="availability.data">
        <section
          class="availability-page__intake"
          aria-label="Приём новых заказов"
        >
          <AvailabilityChange
            :id="null"
            kind="intake"
            label="Принимать новые заказы"
            :value="availability.data.intake.acceptsNewOrders"
            :disabled="mutationDisabled"
            :operation="intakeOperation"
            :recovery-disabled="session.busy"
            @change="change"
            @reconcile="reconcile"
          />
          <p v-if="intakeMetadata" class="availability-page__metadata">
            {{ intakeMetadata }}
          </p>
        </section>
        <AvailabilityOperation
          v-if="retainedOperation"
          :operation="retainedOperation"
          :disabled="session.busy"
          @reconcile="reconcile"
        />
        <div v-if="readFailure" class="availability-page__feedback">
          <p role="alert">{{ availability.error }}</p>
          <UiButton
            variant="secondary"
            :loading="availability.loading"
            :disabled="session.busy"
            @activate="availability.refresh"
            >Повторить</UiButton
          >
        </div>
        <AvailabilitySearch
          :mode="mode"
          :search="search"
          :category-id="categoryId ?? allCategoriesValue"
          :categories="categoryOptions"
          :loading="availability.loading"
          :refresh-disabled="refreshDisabled"
          :show-refresh="showRefresh"
          @mode="mode = $event"
          @search="search = $event"
          @category="setCategory"
          @refresh="availability.refresh"
        />
        <div>
          <h2
            id="availability-result-heading"
            class="availability-page__result-heading"
            tabindex="-1"
          >
            {{ mode === "products" ? "Товары" : "Добавки" }}
          </h2>
          <div v-if="empty" class="availability-page__feedback">
            <p>{{ emptyMessage }}</p>
            <UiButton v-if="filtered" variant="quiet" @activate="resetFilters"
              >Сбросить фильтры</UiButton
            >
          </div>
          <AvailabilityTargets
            v-else
            :categories="visibleCategories"
            :groups="visibleGroups"
            :operation="availability.operation"
            :disabled="mutationDisabled"
            :recovery-disabled="session.busy"
            @change="change"
            @reconcile="reconcile"
          />
        </div>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { useAvailabilityStore } from "../entities/availability/availability.store";
import { useSessionStore } from "../entities/session/session.store";
import {
  filterGroups,
  filterProducts,
} from "../entities/availability/availability.filter";
import type {
  AvailabilityIntent,
  AvailabilityMode,
} from "../entities/availability/availability.types";
import AvailabilityChange from "../features/availability-change/AvailabilityChange.vue";
import AvailabilityOperation from "../features/availability-change/AvailabilityOperation.vue";
import AvailabilitySearch from "../features/availability-search/AvailabilitySearch.vue";
import AvailabilityTargets from "../widgets/availability/AvailabilityTargets.vue";
import UiButton from "../shared/ui/UiButton/UiButton.vue";
import { allCategoriesValue } from "./AvailabilityPage.constants";
import type {
  AvailabilityPageEmits,
  AvailabilityPageProps,
} from "./AvailabilityPage.types";

const props = defineProps<AvailabilityPageProps>();
const emit = defineEmits<AvailabilityPageEmits>();
const availability = useAvailabilityStore();
const session = useSessionStore();
const mode = ref<AvailabilityMode>("products");
const search = ref("");
const categoryId = ref<string | null>(null);
const active = ref(false);
const categoryOptions = computed(() => [
  { value: allCategoriesValue, label: "Все категории" },
  ...(availability.data?.categories.map((category) => ({
    value: category.id,
    label: `${category.label}${category.inactive ? " (Неактивна)" : ""}`,
  })) ?? []),
]);
const visibleCategories = computed(() =>
  availability.data === null || mode.value !== "products"
    ? []
    : filterProducts(availability.data, search.value, categoryId.value),
);
const visibleGroups = computed(() =>
  availability.data === null || mode.value !== "addons"
    ? []
    : filterGroups(availability.data, search.value, categoryId.value),
);
const visibleIds = computed(
  () =>
    new Set([
      ...visibleCategories.value.flatMap((category) =>
        category.products.flatMap((product) => [
          product.id,
          ...product.choices.map((choice) => choice.id),
        ]),
      ),
      ...visibleGroups.value.flatMap((group) =>
        group.options.map((option) => option.id),
      ),
    ]),
);
const intakeOperation = computed(() =>
  availability.operation?.kind === "intake" ? availability.operation : null,
);
const retainedOperation = computed(() =>
  availability.operation !== null &&
  availability.locked &&
  availability.operation.kind !== "intake" &&
  (availability.operation.id === null ||
    !visibleIds.value.has(availability.operation.id))
    ? availability.operation
    : null,
);
const mutationDisabled = computed(
  () =>
    !active.value ||
    props.navigationError !== "" ||
    session.busy ||
    availability.locked ||
    !availability.fresh,
);
const refreshDisabled = computed(() => session.busy || availability.locked);
const initialLoading = computed(
  () => availability.data === null && availability.error === "",
);
const initialFailure = computed(
  () => availability.data === null && availability.error !== "",
);
const readFailure = computed(
  () => availability.error !== "" && !availability.locked,
);
const showRefresh = computed(() => !availability.locked && !readFailure.value);
const empty = computed(
  () => !visibleCategories.value.length && !visibleGroups.value.length,
);
const filtered = computed(
  () => search.value.trim() !== "" || categoryId.value !== null,
);
const emptyMessage = computed(() =>
  filtered.value
    ? "Ничего не найдено"
    : mode.value === "products"
      ? "Товаров пока нет"
      : "Добавок пока нет",
);
const intakeMetadata = computed(() => {
  const intake = availability.data?.intake;

  if (!intake) return "";

  return [
    intake.updatedByLabel,
    intake.updatedAt === null
      ? null
      : new Intl.DateTimeFormat("ru-RU", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(intake.updatedAt)),
  ]
    .filter((part) => part !== null)
    .join(" · ");
});

function setCategory(id: string | null) {
  categoryId.value = id === allCategoriesValue ? null : id;
}

function resetFilters() {
  search.value = "";
  categoryId.value = null;
}

async function runOperation(run: () => Promise<void>) {
  const initiating = document.activeElement;
  const region = initiating?.closest(
    ".availability-change, .availability-operation",
  );
  const context = `${mode.value}:${search.value}:${categoryId.value}`;
  let moved = false;

  function trackFocus(event: FocusEvent) {
    if (event.target instanceof Node && !region?.contains(event.target))
      moved = true;
  }

  document.addEventListener("focusin", trackFocus);

  try {
    await run();
    await nextTick();

    if (
      active.value &&
      !moved &&
      region !== null &&
      context === `${mode.value}:${search.value}:${categoryId.value}` &&
      initiating instanceof HTMLElement &&
      (initiating.matches(":disabled") || !initiating.isConnected)
    ) {
      const id = availability.operation?.id;

      (id === null || id === undefined
        ? document.getElementById("availability-result-heading")
        : (document.getElementById(`availability-${id}`) ??
          document.getElementById("availability-result-heading"))
      )?.focus({ preventScroll: true });
    }
  } finally {
    document.removeEventListener("focusin", trackFocus);
  }
}

function change(intent: AvailabilityIntent) {
  if (!mutationDisabled.value)
    void runOperation(() => availability.change(intent));
}

function reconcile() {
  if (active.value && props.navigationError === "")
    void runOperation(availability.reconcile);
}

function synchronize() {
  if (!active.value) return;
  if (props.navigationError !== "") {
    availability.cancelRead();

    return;
  }

  if (!session.busy && !availability.locked) void availability.refresh();
}

watch(() => [session.busy, props.navigationError], synchronize);
watch([() => availability.catalogEpoch, () => availability.locked], () => {
  if (!availability.fresh) synchronize();
});
onActivated(() => {
  active.value = true;
  synchronize();
});
onDeactivated(() => {
  active.value = false;
  availability.cancelRead();
});
onUnmounted(() => {
  active.value = false;
  availability.cancelRead();
});
</script>

<style scoped>
.availability-page {
  display: grid;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.availability-page__intake {
  display: grid;
  gap: var(--space-sm);
  padding-block-end: var(--space-xl);
  border-block-end: var(--border-width) solid var(--color-border);
}
.availability-page__metadata {
  color: var(--color-foreground-muted);
  font-size: var(--font-data);
  overflow-wrap: anywhere;
}
.availability-page__feedback {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
}
.availability-page__result-heading {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
