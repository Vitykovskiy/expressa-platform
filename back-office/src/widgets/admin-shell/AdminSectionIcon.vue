<template>
  <ClipboardList
    v-if="section === 'orders'"
    aria-hidden="true"
    class="admin-section-icon"
    :size="size"
  />
  <ToggleRight
    v-else-if="section === 'availability'"
    aria-hidden="true"
    class="admin-section-icon"
    :size="size"
  />
  <BookOpen
    v-else-if="section === 'menu'"
    aria-hidden="true"
    class="admin-section-icon"
    :size="size"
  />
</template>

<script setup lang="ts">
import { BookOpen, ClipboardList, ToggleRight } from "lucide-vue-next";

import type { AdminSectionIconProps } from "./AdminSectionIcon.types";

withDefaults(defineProps<AdminSectionIconProps>(), { size: 20 });
</script>

<style scoped lang="scss">
.admin-section-icon {
  display: block;
  flex: none;
}
</style>
