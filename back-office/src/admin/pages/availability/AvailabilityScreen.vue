<template>
  <main class="availability-screen">
    <div class="availability-screen__workspace">
      <div class="availability-screen__filters">
        <h1 class="availability-screen__title">Доступность</h1>
        <FilterTabs v-model="activeCategory" :items="categoryTabs" />
      </div>

      <div class="availability-screen__content">
        <EmptyState
          v-if="groupedItems.length === 0"
          title="Меню пусто"
          description="Позиции появятся после добавления в меню"
        />
        <div v-else class="availability-screen__groups">
          <AvailabilityGroup
            v-for="group in groupedItems"
            :key="group.category"
            :category="group.category"
            :items="group.items"
            @availability-change="changeAvailability"
          />
        </div>
      </div>
    </div>

    <v-snackbar v-model="snackbarOpen" color="success" timeout="3000">
      Сохранено
    </v-snackbar>
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import type { AvailabilityChangeEvent } from "../../shared/ui/Admin.types";
import EmptyState from "../../shared/ui/empty-state/EmptyState.vue";
import FilterTabs from "../../shared/ui/filter-tabs/FilterTabs.vue";
import AvailabilityGroup from "./AvailabilityGroup.vue";
import { AVAILABILITY_ALL_CATEGORY } from "./AvailabilityScreen.constants";
import type {
  AvailabilityItemGroup,
  AvailabilityScreenEmits,
  AvailabilityScreenProps,
} from "./AvailabilityScreen.types";

const props = defineProps<AvailabilityScreenProps>();
const emit = defineEmits<AvailabilityScreenEmits>();

const activeCategory = shallowRef<string>(AVAILABILITY_ALL_CATEGORY);
const snackbarOpen = shallowRef(false);

const categories = computed(() => [
  AVAILABILITY_ALL_CATEGORY,
  ...Array.from(new Set(props.menuItems.map((item) => item.category))),
]);

const categoryTabs = computed(() =>
  categories.value.map((category) => ({
    value: category,
    label: category === AVAILABILITY_ALL_CATEGORY ? "Все" : category,
  })),
);

const groupedItems = computed(() => {
  const items = props.menuItems.filter(
    (item) =>
      activeCategory.value === AVAILABILITY_ALL_CATEGORY ||
      item.category === activeCategory.value,
  );

  return items.reduce<AvailabilityItemGroup[]>((groups, item) => {
    const group = groups.find(
      (currentGroup) => currentGroup.category === item.category,
    );

    if (group) {
      group.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item] });
    }

    return groups;
  }, []);
});

function changeAvailability(event: AvailabilityChangeEvent) {
  emit("availability-change", event);
  snackbarOpen.value = true;
}
</script>

<style scoped lang="scss">
.availability-screen {
  display: flex;
  min-height: 100%;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  background: var(--expressa-color-surface-raised);
}

.availability-screen__workspace {
  display: flex;
  width: min(100%, 1120px);
  min-width: 0;
  min-height: 100%;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
}

.availability-screen__filters {
  padding: var(--expressa-space-md);
}

.availability-screen__title {
  margin: 0 0 var(--expressa-space-sm);
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-tight);
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

@media (min-width: 768px) {
  .availability-screen {
    background: var(--expressa-color-surface);
  }

  .availability-screen__filters {
    padding: var(--expressa-space-lg) var(--expressa-space-lg) 0;
  }

  .availability-screen__content {
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }
}
</style>
