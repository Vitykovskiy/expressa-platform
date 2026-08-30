import {
  HttpException,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { type RolePolicy } from "../domain/auth.types";
import { RolesGuard } from "./roles.guard";

function context(
  role: "customer" | "barista" | "administrator" | undefined,
): ExecutionContext {
  return {
    getClass: () => class TestController {},
    getHandler: () => () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        auth:
          role === undefined
            ? undefined
            : {
                phoneE164: "+79990000000",
                role,
                sessionId: "session-id",
                userId: "user-id",
              },
        headers: {},
      }),
    }),
  } as unknown as ExecutionContext;
}

function guard(policy: RolePolicy | undefined) {
  return new RolesGuard({
    getAllAndOverride: jest.fn().mockReturnValue(policy),
  } as never);
}

describe("RolesGuard", () => {
  it.each([
    ["Customer", "customer", true],
    ["Customer", "barista", false],
    ["Customer", "administrator", false],
    ["Staff", "customer", false],
    ["Staff", "barista", true],
    ["Staff", "administrator", true],
    ["Administrator", "customer", false],
    ["Administrator", "barista", false],
    ["Administrator", "administrator", true],
  ] as const)("применяет %s policy для %s", (policy, role, allowed) => {
    const result = () => guard(policy).canActivate(context(role));
    if (allowed) expect(result()).toBe(true);
    else expect(result).toThrow(HttpException);
  });

  it("отклоняет запрос без SessionGuard context до handler", () => {
    expect(() => guard("Customer").canActivate(context(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it("возвращает ACCESS_DENIED для запрещённой роли", () => {
    try {
      guard("Administrator").canActivate(context("barista"));
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getResponse()).toEqual({
        code: "ACCESS_DENIED",
        details: null,
        message: "Access denied",
      });
    }
  });
});
