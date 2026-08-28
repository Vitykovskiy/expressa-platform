import type { Browser, BrowserContext, Page } from "@playwright/test";

import { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import { MenuManagementPage } from "@pages/back-office/menu/menu-management/menu-management.page";
import { StaffOrdersPage } from "@pages/back-office/orders/staff-orders/staff-orders.page";
import { CustomerAuthPage } from "@pages/front-office/auth/customer-auth/customer-auth.page";
import { CheckoutPage } from "@pages/front-office/checkout/checkout/checkout.page";
import { PublicMenuPage } from "@pages/front-office/menu/public-menu/public-menu.page";
import { CustomerOrderPage } from "@pages/front-office/orders/customer-order/customer-order.page";
import { OrderHistoryPage } from "@pages/front-office/orders/order-history/order-history.page";

import type { MultiSessionFixture } from "./multi-session.fixture.types";

export async function useMultiSessionFixture(
  browser: Browser,
  _page: Page,
  use: (fixture: MultiSessionFixture) => Promise<void>,
): Promise<void> {
  const staffContext = await browser.newContext();
  let secondCustomerContext: BrowserContext | undefined;

  try {
    secondCustomerContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    const secondCustomerPage = await secondCustomerContext.newPage();
    const multiSession: MultiSessionFixture = {
      secondCustomer: {
        auth: new CustomerAuthPage(secondCustomerPage),
        menu: new PublicMenuPage(secondCustomerPage),
        checkout: new CheckoutPage(secondCustomerPage),
        order: new CustomerOrderPage(secondCustomerPage),
        orderHistory: new OrderHistoryPage(secondCustomerPage),
      },
      staff: {
        auth: new BackOfficeAuthPage(staffPage),
        menuManagement: new MenuManagementPage(staffPage),
        orders: new StaffOrdersPage(staffPage),
      },
    };

    await use(multiSession);
  } finally {
    await Promise.all([staffContext.close(), secondCustomerContext?.close()]);
  }
}
