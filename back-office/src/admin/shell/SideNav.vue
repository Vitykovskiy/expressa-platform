<template>
  <aside class="side-nav">
    <header class="side-nav-brand">
      <strong>Expressa</strong>
      <span>{{ role === "administrator" ? "Администратор" : "Бариста" }}</span>
    </header>
    <nav aria-label="Разделы администратора" class="side-nav-links">
      <AdminButton
        v-for="section in sections"
        :key="section.id"
        class="side-nav-link"
        :aria-current="section.id === activeSection ? 'page' : undefined"
        :class="{ 'side-nav-link--active': section.id === activeSection }"
        type="button"
        variant="ghost"
        @click="emit('select', section.id)"
      >
        {{ section.label }}
      </AdminButton>
    </nav>
    <AdminButton
      class="side-nav-logout"
      type="button"
      variant="ghost"
      @click="emit('logout')"
    >
      Выйти
    </AdminButton>
  </aside>
</template>

<script setup lang="ts">
import AdminButton from "../shared/ui/admin-button/AdminButton.vue";
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
.side-nav-brand span {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.side-nav-links {
  display: grid;
  align-content: start;
  gap: var(--expressa-space-xs);
  flex: 1;
}
.side-nav-link,
.side-nav-logout {
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block) var(--expressa-space-md);
  border: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  text-align: left;
  cursor: pointer;
}
.side-nav-link--active {
  color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
}
.side-nav-logout {
  margin-top: auto;
  color: var(--expressa-color-text-muted);
}
@media (min-width: 768px) {
  .side-nav {
    display: flex;
    flex-direction: column;
  }
}
</style>
