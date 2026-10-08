<template>
  <aside class="side-nav">
    <header class="side-nav-brand">
      <strong>Expressa</strong>
      <span>{{ role === "administrator" ? "Администратор" : "Бариста" }}</span>
    </header>
    <nav class="side-nav-links">
      <div
        v-for="section in sections"
        :key="section.id"
        class="side-nav-item"
        :class="{ 'side-nav-item--active': section.id === activeSection }"
      >
        <AdminButton
          class="side-nav-link"
          size="compact"
          type="button"
          variant="ghost"
          @click="emit('select', section.id)"
        >
          <span
            class="side-nav-link__content"
            :class="{
              'side-nav-link__content--active': section.id === activeSection,
            }"
          >
            <AdminSectionIcon :section="section.id" />
            <span>{{ section.label }}</span>
          </span>
        </AdminButton>
      </div>
    </nav>
    <AdminButton
      class="side-nav-logout"
      size="compact"
      type="button"
      variant="ghost"
      @click="emit('logout')"
    >
      <span class="side-nav-logout__content">
        <AdminIcon :icon="LogOut" />
        <span>Выйти</span>
      </span>
    </AdminButton>
  </aside>
</template>

<script setup lang="ts">
import { LogOut } from "lucide-vue-next";

import AdminButton from "../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminSectionIcon from "./AdminSectionIcon.vue";
import type { SideNavEmits, SideNavProps } from "./SideNav.types";

defineProps<SideNavProps>();

const emit = defineEmits<SideNavEmits>();
</script>

<style scoped lang="scss">
.side-nav {
  position: fixed;
  inset: 0 auto 0 0;
  display: none;
  width: var(--expressa-size-side-nav-width);
  padding: var(--expressa-space-md);
  background: var(--expressa-color-surface-raised);
  border-right: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.side-nav-brand {
  display: grid;
  gap: var(--expressa-space-xs);
  margin-bottom: var(--expressa-space-xl);
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-brand);
}
.side-nav-brand strong {
  line-height: var(--expressa-line-height-title);
}
.side-nav-brand span {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption-compact);
}
.side-nav-links {
  display: grid;
  align-content: start;
  gap: var(--expressa-space-xs);
  flex: 1;
}
.side-nav-link,
.side-nav-logout {
  width: 100%;
}
.side-nav-item--active {
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-status-info-surface);
}
.side-nav-link__content--active {
  color: var(--expressa-color-accent);
}
.side-nav-logout {
  margin-top: auto;
}
.side-nav-link__content,
.side-nav-logout__content {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--expressa-space-control-inline);
}
@media (min-width: 768px) {
  .side-nav {
    display: flex;
    flex-direction: column;
  }
}
</style>
