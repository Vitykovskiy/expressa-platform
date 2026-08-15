<template>
  <main class="availability-screen">
    <TopBar title="Доступность" />

    <div class="availability-screen__filters">
      <h1 class="availability-screen__title">Доступность</h1>
      <label class="availability-screen__search" for="availability-search">
        <span class="availability-screen__search-label">
          {{ availabilityMessages.searchLabel }}
        </span>
        <AdminTextField
          id="availability-search"
          v-model="search"
          :placeholder="availabilityMessages.searchPlaceholder"
          type="search"
        />
      </label>
      <FilterTabs
        v-model="activeCategory"
        class="availability-screen__tabs"
        :items="categoryTabs"
        layout="responsive"
      />
    </div>

    <div class="availability-screen__content">
      <p v-if="props.loading" role="status">Загружаем доступность…</p>
      <section v-if="props.error !== null" role="alert">
        <p>{{ props.error.message }}</p>
        <AdminButton type="button" @click="emit('retry')"
          >Повторить</AdminButton
        >
      </section>
      <section v-if="props.intake !== null" class="availability-screen__intake">
        <h2 class="availability-screen__intake-title">Приём заказов</h2>
        <ToggleRow
          :disabled="props.saving"
          :label="availabilityMessages.intakeLabel"
          :model-value="props.intake.acceptsNewOrders"
          :sublabel="intakeSublabel"
          @update:model-value="updateIntake"
        />
      </section>
      <EmptyState
        v-if="
          !props.loading && props.intake !== null && groupedItems.length === 0
        "
        :title="availabilityMessages.emptyTitle"
        :description="availabilityMessages.emptyDescription"
      >
        <template #icon>
          <svg
            aria-hidden="true"
            fill="none"
            height="48"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            width="48"
          >
            <path d="M7 6h10a5 5 0 1 1 0 10H7a5 5 0 1 1 0-10Z" />
            <path d="M7 11a1 1 0 1 0 0 .01" />
          </svg>
        </template>
      </EmptyState>
      <div
        v-else-if="!props.loading && props.intake !== null"
        class="availability-screen__groups"
      >
        <AvailabilityGroup
          v-for="group in groupedItems"
          :key="group.id"
          :category="group.name"
          :disabled="props.saving"
          :items="group.items"
          @availability-change="
            (item, value) => emit('availability-change', item, value)
          "
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import ToggleRow from "../../../shared/ui/admin/toggle-row/ToggleRow.vue";
import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import EmptyState from "../../../shared/ui/admin/empty-state/EmptyState.vue";
import FilterTabs from "../../../shared/ui/admin/filter-tabs/FilterTabs.vue";
import AvailabilityGroup from "./AvailabilityGroup.vue";
import {
  AVAILABILITY_ALL_CATEGORY,
  availabilityMessages,
} from "./AvailabilityScreen.constants";
import type {
  AvailabilityItemGroup,
  AvailabilityScreenEmits,
  AvailabilityScreenProps,
} from "./AvailabilityScreen.types";

const props = defineProps<AvailabilityScreenProps>();
const emit = defineEmits<AvailabilityScreenEmits>();

const activeCategory = shallowRef<string>(AVAILABILITY_ALL_CATEGORY);
const search = shallowRef("");

const categories = computed(() => [
  AVAILABILITY_ALL_CATEGORY,
  ...props.groups.map((group) => group.id),
]);

const categoryTabs = computed(() =>
  categories.value.map((category) => ({
    value: category,
    label:
      category === AVAILABILITY_ALL_CATEGORY
        ? "Все"
        : (props.groups.find((group) => group.id === category)?.name ?? ""),
  })),
);

const groupedItems = computed(() => {
  const normalizedSearch = search.value.trim().toLocaleLowerCase("ru-RU");

  return props.groups.reduce<AvailabilityItemGroup[]>((groups, group) => {
    if (
      activeCategory.value !== AVAILABILITY_ALL_CATEGORY &&
      group.id !== activeCategory.value
    ) {
      return groups;
    }

    const items = group.items.filter(
      (item) =>
        normalizedSearch === "" ||
        `${item.label} ${item.sublabel}`
          .toLocaleLowerCase("ru-RU")
          .includes(normalizedSearch),
    );
    if (items.length > 0) {
      groups.push({ id: group.id, items, name: group.name });
    }

    return groups;
  }, []);
});

const intakeSublabel = computed(() => {
  if (props.intake === null) return "";
  if (props.intake.updatedBy === null || props.intake.updatedAt === null) {
    return props.intake.acceptsNewOrders
      ? availabilityMessages.intakeOn
      : availabilityMessages.intakeOff;
  }

  return `Изменил ${props.intake.updatedBy} ${formatDate(props.intake.updatedAt)}`;
});

function updateIntake(value: boolean): void {
  emit("intake-change", value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}
</script>

<style scoped lang="scss">
.availability-screen {
  display: flex;
  inline-size: 100%;
  min-inline-size: 0;
  max-inline-size: 100%;
  height: 100%;
  min-height: 100%;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  background: var(--expressa-color-surface-raised);
}

.availability-screen__filters {
  padding: 0;
}

.availability-screen__title {
  display: none;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: 2rem;
}

.availability-screen__tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--expressa-color-surface);
}

.availability-screen__search {
  display: grid;
  gap: var(--expressa-space-2xs);
  padding: var(--expressa-space-md);
}

.availability-screen__search-label,
.availability-screen__intake-title {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-semibold);
}

.availability-screen__content {
  min-width: 0;
  flex: 1;
  overflow-y: auto;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}

.availability-screen__groups {
  display: grid;
  gap: var(--expressa-space-lg);
}

.availability-screen__intake {
  margin-bottom: var(--expressa-space-lg);
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  padding: var(--expressa-space-md);
}

.availability-screen__intake-title {
  margin: 0 0 var(--expressa-space-sm);
}

@media (min-width: 768px) {
  .availability-screen {
    inline-size: 100%;
    min-inline-size: max-content;
    max-inline-size: none;
    background: var(--expressa-color-surface);
  }

  .availability-screen__filters {
    padding: var(--expressa-space-lg) var(--expressa-space-lg) 0;
  }

  .availability-screen__title {
    display: block;
    margin-bottom: var(--expressa-space-md);
  }

  .availability-screen__tabs {
    position: static;
  }

  .availability-screen__search {
    padding: 0 0 var(--expressa-space-md);
  }

  .availability-screen__content {
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }
}
</style>
