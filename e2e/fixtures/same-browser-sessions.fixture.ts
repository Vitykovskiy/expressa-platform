import type { Page } from "@playwright/test";

import { BackOfficeAuthPage } from "@pages/back-office/auth/back-office-auth/back-office-auth.page";
import { CustomerAuthPage } from "@pages/front-office/auth/customer-auth/customer-auth.page";

import type { SameBrowserSessionsFixture } from "./same-browser-sessions.fixture.types";

export async function useSameBrowserSessionsFixture(
  page: Page,
  use: (fixture: SameBrowserSessionsFixture) => Promise<void>,
): Promise<void> {
  const administratorPage = await page.context().newPage();
  const secondAdministratorPage = await page.context().newPage();

  try {
    await use({
      customer: {
        page,
        auth: new CustomerAuthPage(page),
      },
      administrator: {
        page: administratorPage,
        auth: new BackOfficeAuthPage(administratorPage),
      },
      secondAdministrator: {
        page: secondAdministratorPage,
        auth: new BackOfficeAuthPage(secondAdministratorPage),
      },
    });
  } finally {
    await Promise.all([
      administratorPage.close(),
      secondAdministratorPage.close(),
    ]);
  }
}
