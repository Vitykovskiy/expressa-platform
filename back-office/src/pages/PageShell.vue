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
    <p v-if="description" class="page-shell-description">
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

withDefaults(
  defineProps<{
    description?: string;
    title?: string;
  }>(),
  { description: "", title: "" },
);

const attrs = useAttrs();

const slots = defineSlots<{
  default?(): unknown;
}>();
</script>

<style scoped>
.page-shell {
  width: 100%;
  max-width: 1440px;
  min-width: 0;
  margin: 0 auto;
  padding: var(--expressa-space-32);
}

.page-shell-title {
  margin: 0 0 var(--expressa-space-24);
  color: rgb(var(--v-theme-on-surface));
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
  overflow-wrap: anywhere;
}

.page-shell-description {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  overflow-wrap: anywhere;
}

.page-shell-content {
  margin-top: var(--expressa-space-24);
}

@media (max-width: 1023px) {
  .page-shell {
    padding: var(--expressa-space-24);
  }
}

@media (max-width: 767px) {
  .page-shell {
    padding: var(--expressa-space-16);
  }
}
</style>
