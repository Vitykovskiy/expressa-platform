import ordersActive from "./assets/orders-active.svg";
import ordersMobileActive from "./assets/orders-mobile-active.svg";
import availabilityActive from "./assets/availability-active.svg";
import availabilityMobileActive from "./assets/availability-mobile-active.svg";
import catalogActive from "./assets/catalog-active.svg";
import catalogMobileActive from "./assets/catalog-mobile-active.svg";
import usersActive from "./assets/users-active.svg";
import usersMobileActive from "./assets/users-mobile-active.svg";
import settingsActive from "./assets/settings-active.svg";
import settingsMobileActive from "./assets/settings-mobile-active.svg";
import orders from "./assets/orders.svg";
import availability from "./assets/availability.svg";
import catalog from "./assets/catalog.svg";
import users from "./assets/users.svg";
import settings from "./assets/settings.svg";
import ordersMobile from "./assets/orders-mobile.svg";
import availabilityMobile from "./assets/availability-mobile.svg";
import catalogMobile from "./assets/catalog-mobile.svg";
import usersMobile from "./assets/users-mobile.svg";
import settingsMobile from "./assets/settings-mobile.svg";
import type { StaffNavigationItem } from "./StaffNavigation.types";

export const STAFF_NAVIGATION: readonly StaffNavigationItem[] = [
  {
    section: "orders",
    label: "Заказы",
    icon: orders,
    mobileIcon: ordersMobile,
    activeIcon: ordersActive,
    activeMobileIcon: ordersMobileActive,
  },
  {
    section: "availability",
    label: "Доступность",
    icon: availability,
    mobileIcon: availabilityMobile,
    activeIcon: availabilityActive,
    activeMobileIcon: availabilityMobileActive,
  },
  {
    section: "catalog",
    label: "Меню",
    icon: catalog,
    mobileIcon: catalogMobile,
    activeIcon: catalogActive,
    activeMobileIcon: catalogMobileActive,
  },
  {
    section: "users",
    label: "Пользователи",
    icon: users,
    mobileIcon: usersMobile,
    activeIcon: usersActive,
    activeMobileIcon: usersMobileActive,
  },
  {
    section: "settings",
    label: "Настройки",
    icon: settings,
    mobileIcon: settingsMobile,
    activeIcon: settingsActive,
    activeMobileIcon: settingsMobileActive,
  },
];
