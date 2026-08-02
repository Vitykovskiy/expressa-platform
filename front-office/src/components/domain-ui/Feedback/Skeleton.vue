<template>
  <div class="skeleton" aria-label="Загрузка" aria-busy="true">
    <i v-for="line in lineNumbers" :key="line" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ name: "FoLoadingSkeleton" });
const props = withDefaults(defineProps<{ lines?: number }>(), { lines: 3 });
const lineNumbers = computed(() =>
  Array.from({ length: props.lines }, (_, index) => index + 1),
);
</script>
<style scoped>
.skeleton {
  display: grid;
  gap: var(--fo-space-2);
}
.skeleton i {
  display: block;
  height: 1rem;
  border-radius: var(--fo-radius-sm);
  background: linear-gradient(
    90deg,
    var(--fo-surface-muted),
    var(--fo-surface),
    var(--fo-surface-muted)
  );
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}
.skeleton i:last-child {
  width: 65%;
}
@keyframes pulse {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton i {
    animation: none;
  }
}
</style>
