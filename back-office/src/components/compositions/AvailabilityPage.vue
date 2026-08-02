<template>
  <section class="page">
    <h1>Доступность</h1>
    <Skeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="emit('retry')" />
    <template v-else>
      <UiSearchField v-model="query" label="Поиск доступности" />
      <OrderIntakeControl
        :enabled="intakeEnabled"
        :last-change="intakeLastChange"
        :save="saveIntake"
      />
      <EmptyState
        v-if="visibleGroups.length === 0"
        title="Ничего не найдено"
        message="Измените запрос или добавьте товары в меню."
      />
      <AvailabilityGroup
        v-for="group in visibleGroups"
        :key="group.title"
        :title="group.title"
        :items="group.items"
        :save="saveAvailability"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import AvailabilityGroup from "../domain-ui/Availability/AvailabilityGroup.vue";
import type { AvailabilityItem } from "../domain-ui/Availability/AvailabilityRow.vue";
import OrderIntakeControl from "../domain-ui/Availability/OrderIntakeControl.vue";
import EmptyState from "../domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../domain-ui/Feedback/ErrorState.vue";
import Skeleton from "../domain-ui/Feedback/Skeleton.vue";
import UiSearchField from "../../shared/ui/UiSearchField.vue";

export interface AvailabilityGroupData {
  title: string;
  items: AvailabilityItem[];
}
const props = withDefaults(
  defineProps<{
    groups: AvailabilityGroupData[];
    intakeEnabled: boolean;
    intakeLastChange?: { author: string; at: string };
    saveAvailability: (
      item: AvailabilityItem,
      available: boolean,
    ) => Promise<{ author: string; at: string }>;
    saveIntake: (enabled: boolean) => Promise<{ author: string; at: string }>;
    loading?: boolean;
    error?: string;
  }>(),
  { intakeLastChange: undefined, loading: false, error: "" },
);
const emit = defineEmits<{ retry: [] }>();
const query = shallowRef("");
const visibleGroups = computed(() =>
  props.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.name
          .toLocaleLowerCase()
          .includes(query.value.trim().toLocaleLowerCase()),
      ),
    }))
    .filter((group) => group.items.length),
);
</script>

<style scoped>
.page {
  display: grid;
  gap: var(--expressa-space-4);
}
h1 {
  margin: 0;
}
</style>
