import { expect, test as base } from "@playwright/test";

import { getE2eEnvironment } from "../support/config/e2e-environment";
import type { E2eEnvironment } from "../support/config/e2e-environment.types";

type E2eFixtures = {
  readonly e2eEnvironment: E2eEnvironment;
};

export const test = base.extend<E2eFixtures>({
  e2eEnvironment: async (_, use) => {
    await use(getE2eEnvironment());
  },
});

export { expect };
