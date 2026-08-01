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
.page-shell {
  max-width: 48rem;
}

.page-shell-title {
  margin: 0;
}

.page-shell-description {
  margin: 1rem 0 0;
}
</style>
