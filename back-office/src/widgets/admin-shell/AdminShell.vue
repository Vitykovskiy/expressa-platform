<template>
  <div class="admin-shell">
    <SideNav
      :role="props.role"
      :sections="sections"
      :active-section="props.activeSection"
      @select="emit('navigate', $event)"
      @logout="emit('logout')"
    />
    <main class="admin-shell-content">
      <slot />
    </main>
    <TabBar
      :sections="sections"
      :active-section="props.activeSection"
      @logout="emit('logout')"
      @select="emit('navigate', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AdminShellEmits, AdminShellProps } from "./AdminShell.types";
import SideNav from "./SideNav.vue";
import TabBar from "./TabBar.vue";

const props = defineProps<AdminShellProps>();
const emit = defineEmits<AdminShellEmits>();
const sections = computed(() =>
  props.items.map(({ label, section }) => ({ id: section, label })),
);
</script>

<style scoped lang="scss">
.admin-shell {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100dvh;
  overflow: hidden;
  background: var(--expressa-color-surface-raised);
}

.admin-shell-content {
  height: auto;
  min-height: 0;
  padding-bottom: 0;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .admin-shell-content {
    margin-left: var(--expressa-size-side-nav-width);
  }
}
</style>
