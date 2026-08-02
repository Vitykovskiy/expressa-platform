<template>
  <div class="availability-row">
    <div>
      <strong>{{ item.name }}</strong
      ><LastChangeMeta :change="lastChange" />
    </div>
    <UiToggle
      :model-value="current"
      :label="current ? 'Доступно' : 'Недоступно'"
      :disabled="saving"
      @update:model-value="update"
    />
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { shallowRef } from "vue";
import UiToggle from "../../../shared/ui/UiToggle.vue";
import LastChangeMeta from "./LastChangeMeta.vue";
export interface AvailabilityItem {
  id: string;
  type: "product" | "size" | "modifier";
  name: string;
  available: boolean;
  lastChange?: { author: string; at: string };
}
const props = defineProps<{
  item: AvailabilityItem;
  save: (
    item: AvailabilityItem,
    available: boolean,
  ) => Promise<{ author: string; at: string }>;
}>();
const current = shallowRef(props.item.available);
const lastChange = shallowRef(props.item.lastChange);
const saving = shallowRef(false);
const error = shallowRef("");
async function update(value: boolean) {
  const previous = current.value;
  current.value = value;
  saving.value = true;
  error.value = "";
  try {
    const change = await props.save(props.item, value);
    lastChange.value = change;
  } catch {
    current.value = previous;
    error.value = "Не удалось сохранить доступность";
  } finally {
    saving.value = false;
  }
}
</script>
<style scoped>
.availability-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--expressa-space-2);
  align-items: center;
  padding: var(--expressa-space-2);
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.availability-row p {
  grid-column: 1/-1;
}
</style>
