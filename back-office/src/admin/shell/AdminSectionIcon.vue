<template>
  <svg
    aria-hidden="true"
    class="admin-section-icon"
    fill="none"
    focusable="false"
    :height="size"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
    :width="size"
  >
    <template v-if="section === 'orders'">
      <rect height="16" rx="2" width="14" x="5" y="4" />
      <path d="M9 4h6v3H9zM9 11h6M9 15h4" />
    </template>
    <template v-else-if="section === 'availability'">
      <rect height="10" rx="5" width="18" x="3" y="7" />
      <circle cx="16" cy="12" r="2" />
    </template>
    <template v-else-if="section === 'menu'">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </template>
    <template v-else-if="section === 'users'">
      <circle cx="9" cy="8" r="3" />
      <path
        d="M3 20v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6M21 20v-1a6 6 0 0 0-3-5.2"
      />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.56-1H5.4v-3h.12a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.8 5.94l.06.06A1.7 1.7 0 0 0 10.74 6.34a1.7 1.7 0 0 0 1-1.56V4.7h3v.08a1.7 1.7 0 0 0 1 1.56A1.7 1.7 0 0 0 17.62 6l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1h.12v3h-.12a1.7 1.7 0 0 0-1.56 1Z"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { AdminSectionIconProps } from "./AdminSectionIcon.types";

withDefaults(defineProps<AdminSectionIconProps>(), { size: 20 });
</script>

<style scoped lang="scss">
.admin-section-icon {
  display: block;
  flex: none;
}
</style>
