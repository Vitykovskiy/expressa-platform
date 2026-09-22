<template>
  <AdminIcon
    v-if="section === 'orders'"
    aria-hidden="true"
    :icon="ClipboardList"
  />
  <AdminIcon
    v-else-if="section === 'availability'"
    aria-hidden="true"
    :icon="ToggleRight"
  />
  <AdminIcon
    v-else-if="section === 'menu'"
    aria-hidden="true"
    :icon="BookOpen"
  />
</template>

<script setup lang="ts">
import { BookOpen, ClipboardList, ToggleRight } from "lucide-vue-next";

import AdminIcon from "../../shared/ui/admin/admin-icon/AdminIcon.vue";

import type { AdminSectionIconProps } from "./AdminSectionIcon.types";

defineProps<AdminSectionIconProps>();
</script>
