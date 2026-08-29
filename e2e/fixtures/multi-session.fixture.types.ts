import type { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import type { AvailabilityManagementPage } from "@pages/back-office/availability/availability-management/availability-management.page";
import type { MenuManagementPage } from "@pages/back-office/menu/menu-management/menu-management.page";
import type { StaffOrdersPage } from "@pages/back-office/orders/staff-orders/staff-orders.page";
import type { CustomerAuthPage } from "@pages/front-office/auth/customer-auth/customer-auth.page";
import type { CheckoutPage } from "@pages/front-office/checkout/checkout/checkout.page";
import type { PublicMenuPage } from "@pages/front-office/menu/public-menu/public-menu.page";
import type { CustomerOrderPage } from "@pages/front-office/orders/customer-order/customer-order.page";
import type { OrderHistoryPage } from "@pages/front-office/orders/order-history/order-history.page";

export interface MultiSessionFixture {
  readonly secondCustomer: SecondCustomerSession;
  readonly staff: StaffSession;
}

interface SecondCustomerSession {
  readonly auth: CustomerAuthPage;
  readonly menu: PublicMenuPage;
  readonly checkout: CheckoutPage;
  readonly order: CustomerOrderPage;
  readonly orderHistory: OrderHistoryPage;
}

interface StaffSession {
  readonly auth: BackOfficeAuthPage;
  readonly availabilityManagement: AvailabilityManagementPage;
  readonly menuManagement: MenuManagementPage;
  readonly orders: StaffOrdersPage;
}
