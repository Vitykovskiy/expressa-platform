import type { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import type { CustomerAuthPage } from "@pages/front-office/auth/customer-auth/customer-auth.page";
import type { Page } from "@playwright/test";

export interface SameBrowserSessionsFixture {
  readonly customer: SameBrowserCustomerSession;
  readonly administrator: SameBrowserAdministratorSession;
  readonly secondAdministrator: SameBrowserAdministratorSession;
}

interface SameBrowserCustomerSession {
  readonly page: Page;
  readonly auth: CustomerAuthPage;
}

interface SameBrowserAdministratorSession {
  readonly page: Page;
  readonly auth: BackOfficeAuthPage;
}
