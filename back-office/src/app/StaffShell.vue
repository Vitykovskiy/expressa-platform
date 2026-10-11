<template>
  <div class="staff-shell">
    <header class="staff-shell__header">
      <div class="staff-shell__identity">
        <h1
          v-if="staff"
          id="staff-section-heading"
          tabindex="-1"
          class="staff-shell__title"
        >
          {{ title }}
        </h1>
        <span v-else class="staff-shell__brand">Expressa</span>
        <span v-if="roleLabel" class="staff-shell__role">{{ roleLabel }}</span>
      </div>
      <div class="staff-shell__controls">
        <ThemeControl />
        <slot name="notifications" />
        <UiButton
          v-if="staff"
          variant="quiet"
          :loading="busy"
          @activate="emit('logout')"
          >Выйти</UiButton
        >
      </div>
    </header>
    <nav
      v-if="staff"
      class="staff-shell__navigation"
      aria-label="Разделы сотрудника"
    >
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.href"
        :aria-current="link.id === section ? 'page' : undefined"
        @click="emit('navigate', link.id, $event)"
        >{{ link.label }}</a
      >
    </nav>
    <slot name="notification-order" />
    <div v-if="staff && error" class="staff-shell__error" role="alert">
      {{ error }}
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../shared/ui/UiButton/UiButton.vue";
import ThemeControl from "./ThemeControl.vue";
import { staffSections } from "./navigation.constants";
import type {
  StaffShellEmits,
  StaffShellProps,
  StaffShellSlots,
} from "./StaffShell.types";

const props = defineProps<StaffShellProps>();
const emit = defineEmits<StaffShellEmits>();

defineSlots<StaffShellSlots>();

const roleLabel = computed(() =>
  props.role === "barista"
    ? "Бариста"
    : props.role === "administrator"
      ? "Администратор"
      : null,
);
const title = computed(
  () => staffSections.find((section) => section.id === props.section)?.label,
);
</script>

<style scoped>
.staff-shell {
  inline-size: 100%;
  max-inline-size: var(--content-width);
  margin-inline: auto;
  padding: var(--space-xl);
}
.staff-shell__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-xl);
  margin-block-end: var(--space-xxl);
}
.staff-shell__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-md);
  min-inline-size: 0;
}
.staff-shell__title {
  font-size: var(--font-page-title);
  line-height: var(--line-page-title);
  letter-spacing: var(--tracking-page-title);
}
.staff-shell__brand {
  font-weight: var(--weight-heading);
}
.staff-shell__role {
  font-size: var(--font-data);
  color: var(--color-foreground-muted);
}
.staff-shell__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-sm);
}
.staff-shell__error {
  color: var(--color-danger);
  margin-block-end: var(--space-lg);
}
.staff-shell__navigation {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-block-end: var(--space-xl);
}
.staff-shell__navigation a {
  min-block-size: var(--control-height);
  display: inline-flex;
  align-items: center;
  padding-inline: var(--space-lg);
  border-radius: var(--radius-control);
  color: var(--color-foreground-muted);
  font-weight: var(--weight-label);
  text-decoration: none;
}
.staff-shell__navigation a[aria-current="page"] {
  background: var(--color-selected);
  color: var(--color-on-selected);
}
/* U02 narrow gutter, exact 600px boundary. */
@media (max-width: 37.499rem) {
  .staff-shell {
    padding: var(--space-lg);
  }
}
</style>
