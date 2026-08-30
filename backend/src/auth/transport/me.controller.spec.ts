import { UnauthorizedException } from "@nestjs/common";
import { GUARDS_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { MeController } from "./me.controller";
import { SessionGuard } from "./session.guard";

describe("MeController", () => {
  it("возвращает current user по Bearer token", async () => {
    const getCurrentUser = {
      execute: jest.fn().mockResolvedValue({
        id: "user-id",
        phoneE164: "+79123456789",
        role: "customer",
      }),
    };
    const controller = new MeController(getCurrentUser as never);

    await expect(
      controller.currentUser("Bearer access-token", {
        sessionId: "session-id",
        userId: "user-id",
        phoneE164: "+79123456789",
        role: "customer",
      }),
    ).resolves.toEqual({
      id: "user-id",
      phoneE164: "+79123456789",
      role: "customer",
    });
    expect(getCurrentUser.execute).toHaveBeenCalledWith("access-token");
    await expect(
      controller.currentUser("bearer access-token", {} as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("регистрирует GET /me c SessionGuard", () => {
    const prototype = MeController.prototype;

    expect(Reflect.getMetadata(PATH_METADATA, MeController)).toBe("me");
    expect(Reflect.getMetadata(PATH_METADATA, prototype.currentUser)).toBe("/");
    expect(
      Reflect.getMetadata(GUARDS_METADATA, prototype.currentUser),
    ).toContain(SessionGuard);
  });
});
