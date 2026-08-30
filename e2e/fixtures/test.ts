import { expect, test as base } from "@playwright/test";

import { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import { AvailabilityManagementPage } from "@pages/back-office/availability/availability-management/availability-management.page";
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

import { useMultiSessionFixture } from "./multi-session.fixture";
import type { MultiSessionFixture } from "./multi-session.fixture.types";

export { expectedResult } from "./expected-result";

export { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

type E2eFixtures = {
  readonly e2eEnvironment: E2eEnvironment;
  readonly e2eCredentials: E2eCredentials;
  readonly multiSession: MultiSessionFixture;
  readonly backOfficeAuth: BackOfficeAuthPage;
  readonly availabilityManagement: AvailabilityManagementPage;
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
  multiSession: async ({ browser }, use) => {
    await useMultiSessionFixture(browser, use);
  },
  backOfficeAuth: async ({ page }, use) => {
    await use(new BackOfficeAuthPage(page));
  },
  availabilityManagement: async ({ page }, use) => {
    await use(new AvailabilityManagementPage(page));
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
export {
  ProductSize as ProductEditorSize,
  ProductSizeUsage,
  ProductType,
} from "@pages/back-office/menu/menu-management/product-editor/product-editor.types";
export {
  BackOfficeRole,
  BackOfficeWorkspaceSection,
} from "@pages/back-office/auth/back-office-auth/back-office-auth.page.types";
export {
  PhoneVerificationError,
  PhoneVerificationStep,
} from "@components/front-office/auth/phone-verification/phone-verification.component.types";
export { CustomerSessionState } from "@pages/front-office/auth/customer-auth/customer-auth.page.types";
export { ModifierSelectionType } from "@pages/back-office/menu/menu-management/modifier-group-editor/modifier-group-editor.types";
export { ProductSize as ProductConfiguratorSize } from "@pages/front-office/menu/public-menu/product-configurator/product-configurator.types";
export { CartItemSize } from "@pages/front-office/checkout/checkout/cart-panel/cart-panel.component.types";
export { OrderQueueStage } from "@pages/back-office/orders/staff-orders/order-queue/order-queue.types";
export { OrderQueueFilter } from "@pages/back-office/orders/staff-orders/order-queue/order-queue.types";
export { OrderQueueTransitionAction } from "@pages/back-office/orders/staff-orders/order-queue/order-queue.types";
export {
  AvailabilityItemType,
  AvailabilityState,
} from "@pages/back-office/availability/availability-management/availability-list/availability-list.types";
export { OrderHistoryStatus } from "@pages/front-office/orders/order-history/order-history-list/order-history-list.types";
export { OrderStatus } from "@pages/front-office/orders/customer-order/order-details/order-details.types";
