<template>
  <!-- prettier-ignore -->
  <section
    v-bind="attrs"
    class="page-shell"
  >
    <h1 class="page-shell-title">
      {{ title }}
    </h1>
    <p class="page-shell-description">
      {{ description }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  description: string;
  title: string;
}>();

const attrs = useAttrs();
</script>

<style scoped>
.page-shell {
  max-width: 48rem;
  overflow-wrap: anywhere;
}

.page-shell-title {
  margin: 0;
}

.page-shell-description {
  margin: 0;
}
</style>
