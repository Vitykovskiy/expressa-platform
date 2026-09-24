<template>
  <!-- Vue lint requires one attribute per line; prettier-ignore preserves it. -->
  <!-- prettier-ignore -->
  <section
    v-bind="attrs"
    class="page-shell"
  >
    <h1 v-if="title" class="page-shell-title">
      {{ title }}
    </h1>
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

withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: "" },
);

const attrs = useAttrs();

const slots = defineSlots<{
  default?(): unknown;
}>();
</script>

<style scoped>
.page-shell {
  width: 100%;
  min-width: 0;
  padding: var(--expressa-space-24);
}

.page-shell-title {
  margin: 0 0 var(--expressa-space-24);
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
  overflow-wrap: anywhere;
}

.page-shell-content {
  margin-top: var(--expressa-space-24);
}

@media (max-width: 767px) {
  .page-shell {
    padding: var(--expressa-space-16);
  }
}
</style>
