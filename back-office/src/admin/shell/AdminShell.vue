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
      @select="emit('navigate', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ADMIN_SHELL_SECTIONS } from "./AdminShell.constants";
import type { AdminShellEmits, AdminShellProps } from "./AdminShell.types";
import SideNav from "./SideNav.vue";
import TabBar from "./TabBar.vue";

const props = defineProps<AdminShellProps>();
const emit = defineEmits<AdminShellEmits>();

const sections = computed(() =>
  ADMIN_SHELL_SECTIONS.filter((section) =>
    section.roles.includes(props.role),
  ).map(({ id, label }) => ({ id, label })),
);
</script>

<style scoped lang="scss">
.admin-shell {
  height: 100dvh;
  overflow: hidden;
  background: var(--expressa-color-surface-raised);
}

.admin-shell-content {
  height: 100%;
  min-height: 0;
  padding-bottom: calc(
    var(--expressa-size-tab-bar-min-height) + var(--expressa-safe-area-bottom)
  );
  overflow-y: auto;
}

@media (min-width: 768px) {
  .admin-shell-content {
    margin-left: var(--expressa-size-side-nav-width);
    padding-bottom: 0;
  }
}
</style>
