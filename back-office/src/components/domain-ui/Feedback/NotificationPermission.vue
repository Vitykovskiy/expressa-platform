<template>
  <section>
    <p role="status">{{ text }}</p>
    <UiButton v-if="permission === 'default'" @click="emit('request')"
      >Разрешить уведомления</UiButton
    >
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
const props = defineProps<{ permission: "default" | "granted" | "denied" }>();
const emit = defineEmits<{ request: [] }>();
const text = computed(
  () =>
    ({
      default: "Уведомления не настроены",
      granted: "Уведомления разрешены",
      denied: "Уведомления запрещены",
    })[props.permission],
);
</script>
