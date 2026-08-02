<template>
  <p class="error" role="alert">{{ message }}</p>
</template>
<script setup lang="ts">
defineOptions({ name: "FoInlineError" });
defineProps<{ message: string }>();
</script>
<style scoped>
.error {
  margin: 0;
  color: var(--fo-danger);
  font: 400 0.875rem/1.3 var(--fo-font);
  overflow-wrap: anywhere;
}
</style>
