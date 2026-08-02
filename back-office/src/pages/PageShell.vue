<template>
  <!-- Vue lint requires one attribute per line; prettier-ignore preserves it. -->
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
    <div
      v-if="slots.default"
      class="page-shell-content"
    >
      <slot />
    </div>
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

const slots = defineSlots<{
  default?(): unknown;
}>();
</script>

<style scoped>
.page-shell {
  min-width: 0;
}

.page-shell-title {
  margin: 0 0 var(--expressa-space-2);
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}

.page-shell-description {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}

.page-shell-content {
  margin-top: var(--expressa-space-4);
}
</style>
