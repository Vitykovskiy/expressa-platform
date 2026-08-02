<template>
  <section class="state" role="status">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <UiButton v-if="actionLabel" @click="emit('action')">{{
      actionLabel
    }}</UiButton>
  </section>
</template>
<script setup lang="ts">
import UiButton from "../../../shared/ui/UiButton.vue";
defineProps<{ title: string; message: string; actionLabel?: string }>();
const emit = defineEmits<{ action: [] }>();
</script>
<style scoped>
.state {
  padding: var(--expressa-space-6);
  text-align: center;
}
</style>
