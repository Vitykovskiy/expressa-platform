<template>
  <nav class="tab-bar">
    <div
      v-for="section in props.sections"
      :key="section.id"
      class="tab-bar-item"
      :class="{ 'tab-bar-item--active': section.id === props.activeSection }"
    >
      <AdminButton
        class="tab-bar-link"
        size="compact"
        type="button"
        variant="ghost"
        @click="emit('select', section.id)"
      >
        <span
          class="tab-bar-link__content"
          :class="{
            'tab-bar-link__content--active': section.id === props.activeSection,
          }"
        >
          <AdminSectionIcon :section="section.id" />
          <span class="tab-bar-link__label">{{ section.label }}</span>
        </span>
      </AdminButton>
    </div>
    <AdminButton
      class="tab-bar-link"
      size="compact"
      type="button"
      variant="ghost"
      @click="emit('logout')"
    >
      <span class="tab-bar-link__content">
        <AdminIcon :icon="LogOut" />
        <span class="tab-bar-link__label">Выйти</span>
      </span>
    </AdminButton>
  </nav>
</template>

<script setup lang="ts">
import { LogOut } from "lucide-vue-next";

import AdminButton from "../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminSectionIcon from "./AdminSectionIcon.vue";
import type { TabBarEmits, TabBarProps } from "./TabBar.types";

const props = defineProps<TabBarProps>();
const emit = defineEmits<TabBarEmits>();
</script>

<style scoped lang="scss">
.tab-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  min-height: var(--expressa-size-tab-bar-min-height);
  padding-bottom: var(--expressa-safe-area-bottom);
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  box-shadow: var(--expressa-shadow-tab-bar);
}

.tab-bar-item {
  position: relative;
}
.tab-bar-link {
  width: 100%;
  min-width: 0;
  min-height: var(--expressa-size-tab-bar-min-height);
}
.tab-bar-link__content {
  display: grid;
  justify-items: center;
  gap: var(--expressa-space-2xs);
  min-width: 0;
}
.tab-bar-link__content--active {
  color: var(--expressa-color-accent);
}
.tab-bar-item--active {
  background: var(--expressa-color-control-selected-surface);
}
.tab-bar-link__label {
  display: block;
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-control);
  white-space: nowrap;
}
@media (min-width: 768px) {
  .tab-bar {
    display: none;
  }
}
</style>
