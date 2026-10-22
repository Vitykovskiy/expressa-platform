<template>
  <div class="employee-navigation">
    <nav class="desktop-navigation" aria-label="Разделы сотрудника">
      <div class="navigation-brand">
        <p class="brand-name">Expressa</p>
        <p class="brand-role">Бариста</p>
      </div>
      <a
        class="desktop-link"
        :href="ordersHref"
        @click="emit('navigate', $event, ordersHref)"
        ><img :src="ordersIcon" alt="" /><span>Заказы</span></a
      >
      <a
        class="desktop-link selected"
        :href="availabilityHref"
        aria-current="page"
        @click="emit('navigate', $event, availabilityHref)"
        ><img :src="availabilityIcon" alt="" /><span>Доступность</span></a
      >
      <button class="logout" type="button" @click="emit('logout')">
        <img :src="logoutIcon" alt="" /><span>Выйти</span>
      </button>
    </nav>
    <nav class="mobile-navigation" aria-label="Разделы сотрудника">
      <a
        class="mobile-link"
        :href="ordersHref"
        @click="emit('navigate', $event, ordersHref)"
        ><img :src="mobileOrdersIcon" alt="" /><span>Заказы</span></a
      >
      <a
        class="mobile-link selected"
        :href="availabilityHref"
        aria-current="page"
        @click="emit('navigate', $event, availabilityHref)"
        ><img :src="mobileAvailabilityIcon" alt="" /><span>Доступность</span></a
      >
    </nav>
  </div>
</template>

<script setup lang="ts">
import type {
  EmployeeNavigationProps,
  EmployeeNavigationEvent,
} from "./EmployeeNavigation.types";
import ordersIcon from "./assets/orders.svg";
import availabilityIcon from "./assets/availability.svg";
import logoutIcon from "./assets/logout.svg";
import mobileOrdersIcon from "./assets/orders-mobile.svg";
import mobileAvailabilityIcon from "./assets/availability-mobile.svg";

defineProps<EmployeeNavigationProps>();
const emit = defineEmits<{
  navigate: [event: EmployeeNavigationEvent, href: string];
  logout: [];
}>();
</script>

<style scoped>
.employee-navigation {
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
  color: var(--color-foreground);
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
  background: #e8e8ff;
  color: var(--color-primary);
}
.logout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: auto;
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
  .employee-navigation {
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
}
</style>
