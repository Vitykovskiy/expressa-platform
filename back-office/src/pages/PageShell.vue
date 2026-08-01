<script setup lang="ts">
defineProps({
  description: { type: String, required: true },
  title: { type: String, required: true },
})
</script>

<template>
  <section class="page-shell">
    <h1 class="page-shell-title">
      {{ title }}
    </h1>
    <p class="page-shell-description">
      {{ description }}
    </p>
  </section>
</template>

<style scoped>
.page-shell-title {
  margin: 0 0 0.5rem;
}

.page-shell-description {
  margin: 0;
}
</style>
