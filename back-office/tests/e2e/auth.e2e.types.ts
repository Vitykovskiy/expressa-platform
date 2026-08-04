import type { Page, Response } from "@playwright/test";

import type { staffRoles } from "./auth.e2e.constants";

export type AuthPage = Page;
export type AuthResponse = Response;
export type StaffRole = (typeof staffRoles)[number];

export interface AuthEvidence {
  consoleErrors: string[];
  consoleMessages: string[];
  requests: string[];
  requestFailures: string[];
  responseBodies: string[];
  responses: AuthResponse[];
}
