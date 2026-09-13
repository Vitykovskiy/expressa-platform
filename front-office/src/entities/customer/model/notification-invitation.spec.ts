import { beforeEach, describe, expect, it } from "vitest";

import {
  hasNotificationInvitationChoice,
  rememberNotificationInvitationChoice,
} from "./notification-invitation";

describe("notification invitation memory", () => {
  beforeEach(() => window.localStorage.clear());

  it("stores an explicit per-account installation choice without account secrets", () => {
    expect(hasNotificationInvitationChoice("account-a")).toBe(false);
    expect(rememberNotificationInvitationChoice("account-a")).toBe(true);
    expect(hasNotificationInvitationChoice("account-a")).toBe(true);
    expect(hasNotificationInvitationChoice("account-b")).toBe(false);
    expect(window.localStorage.key(0)).not.toContain("token");
    expect(window.localStorage.key(0)).not.toContain("phone");
  });

  it("suppresses automatic exposure when storage cannot be read or written", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(hasNotificationInvitationChoice("account-a", broken)).toBe(true);
    expect(rememberNotificationInvitationChoice("account-a", broken)).toBe(
      false,
    );
  });
});
