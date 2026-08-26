import { expect, test as base } from "@playwright/test";

import { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import { MenuManagementPage } from "@pages/back-office/menu/menu-management/menu-management.page";
import { StaffOrdersPage } from "@pages/back-office/orders/staff-orders/staff-orders.page";
import { CustomerAuthPage } from "@pages/front-office/auth/customer-auth/customer-auth.page";
import { CheckoutPage } from "@pages/front-office/checkout/checkout/checkout.page";
import { PublicMenuPage } from "@pages/front-office/menu/public-menu/public-menu.page";
import { CustomerOrderPage } from "@pages/front-office/orders/customer-order/customer-order.page";
import { OrderHistoryPage } from "@pages/front-office/orders/order-history/order-history.page";
import {
  getE2eCredentials,
  getE2eEnvironment,
} from "@support/config/e2e-environment";
import type {
  E2eCredentials,
  E2eEnvironment,
} from "@support/config/e2e-environment.types";

type E2eFixtures = {
  readonly e2eEnvironment: E2eEnvironment;
  readonly e2eCredentials: E2eCredentials;
  readonly backOfficeAuth: BackOfficeAuthPage;
  readonly menuManagement: MenuManagementPage;
  readonly customerAuth: CustomerAuthPage;
  readonly publicMenu: PublicMenuPage;
  readonly checkout: CheckoutPage;
  readonly customerOrder: CustomerOrderPage;
  readonly orderHistory: OrderHistoryPage;
  readonly staffOrders: StaffOrdersPage;
};

export const test = base.extend<E2eFixtures>({
  // Playwright requires object destructuring for an unused fixture callback.
  // eslint-disable-next-line no-empty-pattern
  e2eEnvironment: async ({}, use) => {
    await use(getE2eEnvironment());
  },
  // Playwright requires object destructuring for an unused fixture callback.
  // eslint-disable-next-line no-empty-pattern
  e2eCredentials: async ({}, use) => {
    await use(getE2eCredentials());
  },
  backOfficeAuth: async ({ page }, use) => {
    await use(new BackOfficeAuthPage(page));
  },
  menuManagement: async ({ page }, use) => {
    await use(new MenuManagementPage(page));
  },
  customerAuth: async ({ page }, use) => {
    await use(new CustomerAuthPage(page));
  },
  publicMenu: async ({ page }, use) => {
    await use(new PublicMenuPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  customerOrder: async ({ page }, use) => {
    await use(new CustomerOrderPage(page));
  },
  orderHistory: async ({ page }, use) => {
    await use(new OrderHistoryPage(page));
  },
  staffOrders: async ({ page }, use) => {
    await use(new StaffOrdersPage(page));
  },
});

export { expect };
