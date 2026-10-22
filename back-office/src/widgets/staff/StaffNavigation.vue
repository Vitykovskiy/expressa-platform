<template>
  <div class="staff-navigation" :class="{ administrator }">
    <nav class="desktop-navigation" aria-label="Разделы сотрудника">
      <div class="navigation-brand">
        <p class="brand-name">Expressa</p>
        <p class="brand-role">
          {{ administrator ? "Администратор" : "Бариста" }}
        </p>
      </div>
      <a
        v-for="item in items"
        :key="item.section"
        class="desktop-link"
        :class="{ selected: section === item.section }"
        :href="links[item.section]"
        :aria-current="section === item.section ? 'page' : undefined"
        @click="emit('navigate', $event, links[item.section])"
      >
        <img
          class="navigation-icon"
          :src="section === item.section ? item.activeIcon : item.icon"
          alt=""
        />
        <span>{{ item.label }}</span>
      </a>
      <div class="navigation-actions">
        <slot name="selection" /><slot name="actions" />
      </div>
      <button class="logout" type="button" @click="emit('logout')">
        <img :src="logoutIcon" alt="" /><span>Выйти</span>
      </button>
    </nav>
    <nav class="mobile-navigation" aria-label="Разделы сотрудника">
      <a
        v-for="item in items"
        :key="item.section"
        class="mobile-link"
        :class="{
          selected: section === item.section,
          'users-link': item.section === 'users',
        }"
        :href="links[item.section]"
        :aria-current="section === item.section ? 'page' : undefined"
        @click="emit('navigate', $event, links[item.section])"
      >
        <img
          class="navigation-icon"
          :src="
            section === item.section ? item.activeMobileIcon : item.mobileIcon
          "
          alt=""
        />
        <span class="mobile-label">{{ item.label }}</span>
      </a>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { STAFF_NAVIGATION } from "./StaffNavigation.constants";
import type { StaffNavigationProps } from "./StaffNavigation.types";
import logoutIcon from "./assets/logout.svg";

const props = defineProps<StaffNavigationProps>();
const emit = defineEmits<{
  navigate: [event: globalThis.MouseEvent, href: string];
  logout: [];
}>();
const items = computed(() =>
  props.administrator ? STAFF_NAVIGATION : STAFF_NAVIGATION.slice(0, 2),
);
</script>

<style scoped>
.staff-navigation {
  width: 220px;
  flex: 0 0 220px;
}
.desktop-navigation {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--color-background);
}
.navigation-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 28px;
}
.brand-name {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}
.brand-role {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--color-foreground-muted);
}
.desktop-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-control);
  color: var(--color-foreground-muted);
  text-decoration: none;
  font-size: 13px;
  line-height: 19.5px;
  font-weight: 500;
}
.desktop-link.selected {
  background: var(--operations-accent-light, #e8e8ff);
  color: var(--color-primary);
}
.navigation-icon {
  display: block;
  flex: 0 0 20px;
}
.navigation-actions {
  margin-top: auto;
}
.logout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 0;
  background: transparent;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  font-weight: 500;
  cursor: pointer;
}
.mobile-navigation {
  display: none;
}
@media (max-width: 767px) {
  .staff-navigation {
    position: fixed;
    z-index: 2;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
  }
  .desktop-navigation {
    display: none;
  }
  .mobile-navigation {
    display: flex;
    height: 60px;
    background: var(--color-surface);
  }
  .mobile-link {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--color-foreground-muted);
    text-decoration: none;
    font-size: 12px;
    line-height: 16px;
  }
  .navigation-icon {
    flex-basis: 22px;
  }
  .mobile-link.selected {
    color: var(--color-primary);
  }
  .mobile-link.selected::before {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
    content: "";
  }
  .administrator .mobile-label {
    height: 24px;
    font-size: 10px;
    line-height: 12px;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .administrator .users-link .mobile-label {
    height: auto;
    font-size: 9px;
  }
}
@media (max-width: 359px) {
  .administrator .mobile-label {
    font-size: 9px;
  }
}
</style>
