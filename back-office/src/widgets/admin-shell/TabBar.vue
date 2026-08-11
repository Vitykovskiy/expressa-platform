<template>
  <nav
    aria-label="Разделы администратора"
    class="tab-bar"
    :class="{ 'tab-bar--with-reserved-slots': props.sections.length === 3 }"
  >
    <AdminButton
      v-for="section in props.sections"
      :key="section.id"
      class="tab-bar-link"
      :aria-current="section.id === props.activeSection ? 'page' : undefined"
      :class="{ 'tab-bar-link--active': section.id === props.activeSection }"
      type="button"
      variant="ghost"
      @click="emit('select', section.id)"
    >
      <AdminSectionIcon :section="section.id" :size="22" />
      <span class="tab-bar-link__label">{{ section.label }}</span>
    </AdminButton>
  </nav>
</template>

<script setup lang="ts">
import AdminButton from "../../shared/ui/admin/admin-button/AdminButton.vue";
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
}

.tab-bar-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-2xs);
  min-width: 0;
  min-height: var(--expressa-size-tab-bar-min-height);
  padding: 0;
  border: var(--expressa-border-width-none);
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-transparent);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.tab-bar-link--active {
  color: var(--expressa-color-accent);
}
.tab-bar-link--active::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: var(--expressa-border-width-strong);
  content: "";
  background: var(--expressa-color-accent);
}
.tab-bar-link__label {
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption-compact);
  text-overflow: ellipsis;
}
.tab-bar--with-reserved-slots {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .tab-bar {
    display: none;
  }
}
</style>
