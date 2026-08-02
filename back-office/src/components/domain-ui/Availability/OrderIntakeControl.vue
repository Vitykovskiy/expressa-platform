<template>
  <section class="intake">
    <UiToggle
      :model-value="current"
      :label="
        current ? 'Принимать новые заказы' : 'Приём новых заказов остановлен'
      "
      :disabled="saving"
      @update:model-value="update"
    /><LastChangeMeta :change="lastChange" />
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<script setup lang="ts">
import { shallowRef } from "vue";
import UiToggle from "../../../shared/ui/UiToggle.vue";
import LastChangeMeta from "./LastChangeMeta.vue";
const props = defineProps<{
  enabled: boolean;
  lastChange?: { author: string; at: string };
  save: (enabled: boolean) => Promise<{ author: string; at: string }>;
}>();
const current = shallowRef(props.enabled);
const saving = shallowRef(false);
const error = shallowRef("");
const lastChange = shallowRef(props.lastChange);
async function update(value: boolean) {
  const previous = current.value;
  current.value = value;
  saving.value = true;
  error.value = "";
  try {
    lastChange.value = await props.save(value);
  } catch {
    current.value = previous;
    error.value = "Не удалось изменить приём заказов";
  } finally {
    saving.value = false;
  }
}
</script>
<style scoped>
.intake {
  display: grid;
  gap: var(--expressa-space-2);
}
</style>
