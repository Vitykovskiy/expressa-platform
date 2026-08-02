<template>
  <section>
    <h2>{{ title }}</h2>
    <AvailabilityRow
      v-for="item in items"
      :key="item.id"
      :item="item"
      :save="save"
    />
  </section>
</template>
<script setup lang="ts">
import AvailabilityRow, { type AvailabilityItem } from "./AvailabilityRow.vue";
defineProps<{
  title: string;
  items: AvailabilityItem[];
  save: (
    item: AvailabilityItem,
    available: boolean,
  ) => Promise<{ author: string; at: string }>;
}>();
</script>
